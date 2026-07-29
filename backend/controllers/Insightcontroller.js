const pool = require("../db/db");
const { salaryInsight } = require("../controllers/aiInsightController");

async function loadMonthData(monthKey) {
  const [[month]] = await pool.query(`SELECT * FROM months WHERE month_key = ?`, [monthKey]);
  if (!month) return null;
  const [brands] = await pool.query(`SELECT * FROM brand_summary WHERE month_id = ?`, [month.id]);
  const totalRev = brands.reduce((s, b) => s + (Number(b.retainer) || 0), 0);
  const overall = totalRev > 0 ? month.grand_salary / totalRev : null;
  const rows = brands.map((b) => ({ brand: b.brand, sal: b.salary_cost, pct: b.sal_ret_pct }));
  return { month, overall, totalSal: month.grand_salary, totalRev, central: month.central_salary, rows };
}

// GET /api/months/:monthKey/insight
// Returns the cached insight if one exists for this month; otherwise generates
// it once via Gemini and stores it so every future view is a plain DB read.
exports.getInsight = async (req, res) => {
  const { monthKey } = req.params;
  const data = await loadMonthData(monthKey);
  if (!data) return res.status(404).json({ error: "Month not found." });

  if (data.month.ai_insight) {
    return res.json({
      ...data.month.ai_insight, // mysql2 parses JSON columns automatically
      cached: true,
      generatedAt: data.month.ai_insight_generated_at,
    });
  }
  if (data.overall == null) {
    return res.status(422).json({ error: "No retainer figures yet for this month — set them before generating an insight." });
  }

  try {
    const insight = await salaryInsight({ ...data});
    await pool.query(`UPDATE months SET ai_insight = ?, ai_insight_generated_at = NOW() WHERE id = ?`, [
      JSON.stringify(insight),
      data.month.id,
    ]);
    res.json({ ...insight, cached: false, generatedAt: new Date().toISOString() });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "Couldn't generate an AI insight right now." });
  }
};

// POST /api/months/:monthKey/insight/regenerate
// Force a fresh Gemini call — use this behind an explicit "Regenerate" button,
// not automatically, so edits don't silently burn tokens on every keystroke.
exports.resalaryInsight = async (req, res) => {
  const { monthKey } = req.params;
  const data = await loadMonthData(monthKey);
  if (!data) return res.status(404).json({ error: "Month not found." });
  if (data.overall == null) return res.status(422).json({ error: "No retainer figures yet for this month." });

  try {
    const insight = await salaryInsight({ ...data });
    await pool.query(`UPDATE months SET ai_insight = ?, ai_insight_generated_at = NOW() WHERE id = ?`, [
      JSON.stringify(insight),
      data.month.id,
    ]);
    res.json({ ...insight, cached: false, generatedAt: new Date().toISOString() });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "Couldn't regenerate the AI insight right now." });
  }
};