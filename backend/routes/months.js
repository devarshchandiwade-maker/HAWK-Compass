const express = require("express");
const multer = require("multer");
const pool = require("../db/db");
const { parseSalRet } = require("../controllers/parsesalret");
const { getInsight, regenerateInsight } = require("../controllers/Insightcontroller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

// POST /api/months/import  (multipart form field: "file")
router.post("/import", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded (field name must be 'file')." });

  let parsed;
  try {
    parsed = parseSalRet(req.file.buffer);
  } catch (e) {
    return res.status(400).json({ error: "That file couldn't be read." });
  }
  if (!parsed) {
    return res.status(422).json({
      error: "Couldn't find the Sal-to-Ret matrix. It needs an 'Employee Name' and 'Salary' header with brand columns.",
    });
  }

  const monthKey = parsed.month || req.body.monthKey;
  if (!monthKey) return res.status(422).json({ error: "Couldn't determine the month for this sheet. Pass monthKey (YYYY-MM) explicitly." });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Upsert the month row
    await conn.query(
      `INSERT INTO months (month_key, sheet_name, central_salary, grand_salary)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE sheet_name=VALUES(sheet_name), central_salary=VALUES(central_salary), grand_salary=VALUES(grand_salary),
         ai_insight=NULL, ai_insight_generated_at=NULL`,
      [monthKey, parsed.sheet, parsed.central, parsed.grandSalary],
    );
    const [[{ id: monthId }]] = await conn.query(`SELECT id FROM months WHERE month_key = ?`, [monthKey]);

    // Clear old data for a re-import of the same month (cascades to employees/allocations)
    await conn.query(`DELETE FROM brands WHERE month_id = ?`, [monthId]);
    await conn.query(`DELETE FROM employees WHERE month_id = ?`, [monthId]);

    // Insert brands, keep a name -> id map. Preserve any existing manual override if you re-import (see note below).
    const brandIds = {};
    for (const name of parsed.brands) {
      const salaryCost = parsed.salaryCost[name] || 0;
      const retainerSheet = parsed.retainer[name] ?? null;
      if (!salaryCost && retainerSheet == null) continue; // skip fully-empty brand columns
      const [r] = await conn.query(
        `INSERT INTO brands (month_id, name, salary_cost, retainer_sheet) VALUES (?, ?, ?, ?)`,
        [monthId, name, salaryCost, retainerSheet],
      );
      brandIds[name] = r.insertId;
    }

    // Insert employees + their per-brand allocations
    for (const emp of parsed.employees) {
      const [r] = await conn.query(
        `INSERT INTO employees (month_id, name, designation, salary) VALUES (?, ?, ?, ?)`,
        [monthId, emp.name, emp.desig, emp.salary],
      );
      const empId = r.insertId;
      for (const brandName in emp.alloc) {
        const brandId = brandIds[brandName];
        if (!brandId) continue;
        await conn.query(
          `INSERT INTO employee_allocations (employee_id, brand_id, alloc_fraction) VALUES (?, ?, ?)`,
          [empId, brandId, emp.alloc[brandName]],
        );
      }
    }

    await conn.commit();
    res.json({
      monthKey,
      employees: parsed.employees.length,
      brands: Object.keys(brandIds).length,
    });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: "Import failed." });
  } finally {
    conn.release();
  }
});

// GET /api/months  -> list of months with YTD-style summary, sorted ascending
router.get("/", async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT month_key, grand_salary, total_retainer, overall_pct FROM month_summary ORDER BY month_key ASC`,
  );
  res.json(rows);
});

// GET /api/months/:monthKey  -> full brand + people breakdown for one month
router.get("/:monthKey", async (req, res) => {
  const { monthKey } = req.params;
  const [[month]] = await pool.query(`SELECT * FROM months WHERE month_key = ?`, [monthKey]);
  if (!month) return res.status(404).json({ error: "Month not found." });

  const [brands] = await pool.query(`SELECT * FROM brand_summary WHERE month_id = ? ORDER BY sal_ret_pct DESC`, [month.id]);
  const [people] = await pool.query(
    `SELECT e.id AS employee_id, e.name, e.designation, e.salary, ea.brand_id, ea.alloc_fraction
     FROM employees e
     JOIN employee_allocations ea ON ea.employee_id = e.id
     WHERE e.month_id = ?`,
    [month.id],
  );

  const peopleByBrand = {};
  for (const p of people) {
    (peopleByBrand[p.brand_id] ||= []).push({
      name: p.name,
      designation: p.designation,
      salary: p.salary,
      alloc: p.alloc_fraction,
      contrib: p.salary * p.alloc_fraction,
    });
  }

  res.json({
    monthKey: month.month_key,
    centralSalary: month.central_salary,
    grandSalary: month.grand_salary,
    brands: brands.map((b) => ({
      brand: b.brand,
      salaryCost: b.salary_cost,
      retainer: b.retainer,
      pct: b.sal_ret_pct,
      people: (peopleByBrand[b.brand_id] || []).sort((a, c) => c.contrib - a.contrib),
    })),
  });
});

// PATCH /api/months/:monthKey/brands/:brandName/retainer  { value: number }
router.patch("/:monthKey/brands/:brandName/retainer", async (req, res) => {
  const { monthKey, brandName } = req.params;
  const value = Number(req.body.value);
  if (!Number.isFinite(value) || value < 0) return res.status(400).json({ error: "value must be a non-negative number." });

  const [[month]] = await pool.query(`SELECT id FROM months WHERE month_key = ?`, [monthKey]);
  if (!month) return res.status(404).json({ error: "Month not found." });

  const [result] = await pool.query(
    `UPDATE brands SET retainer_override = ? WHERE month_id = ? AND name = ?`,
    [value, month.id, decodeURIComponent(brandName)],
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Brand not found for this month." });

  // The insight was generated against the old numbers — clear it so the next
  // /insight view (or an explicit "Regenerate") reflects the edit.
  await pool.query(`UPDATE months SET ai_insight = NULL, ai_insight_generated_at = NULL WHERE id = ?`, [month.id]);

  res.json({ ok: true });
});

// GET  /api/months/:monthKey/insight            -> cached insight, generating once if missing
// POST /api/months/:monthKey/insight/regenerate  -> force a fresh Gemini call
router.get("/:monthKey/insight", getInsight);
router.post("/:monthKey/insight/regenerate", regenerateInsight);

// DELETE /api/months/:monthKey  -> remove an imported month entirely
router.delete("/:monthKey", async (req, res) => {
  const [result] = await pool.query(`DELETE FROM months WHERE month_key = ?`, [req.params.monthKey]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "Month not found." });
  res.json({ ok: true });
});

module.exports = router;