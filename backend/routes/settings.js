const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db/db");

const router = express.Router();

// GET /api/settings/pin -> { hasPin: boolean }
router.get("/pin", async (_req, res) => {
  const [[row]] = await pool.query(`SELECT pin_hash FROM app_settings WHERE id = 1`);
  res.json({ hasPin: !!(row && row.pin_hash) });
});

// POST /api/settings/pin { pin: "1234" }  -> set/replace the PIN. Empty string removes the lock.
router.post("/pin", async (req, res) => {
  const pin = String(req.body.pin ?? "");
  if (pin && pin.length < 4) return res.status(400).json({ error: "Use at least 4 digits." });
  const hash = pin ? await bcrypt.hash(pin, 10) : null;
  await pool.query(`UPDATE app_settings SET pin_hash = ? WHERE id = 1`, [hash]);
  res.json({ ok: true, hasPin: !!hash });
});

// POST /api/settings/pin/verify { pin: "1234" } -> { ok: boolean }
router.post("/pin/verify", async (req, res) => {
  const [[row]] = await pool.query(`SELECT pin_hash FROM app_settings WHERE id = 1`);
  if (!row || !row.pin_hash) return res.json({ ok: true }); // no lock set
  const ok = await bcrypt.compare(String(req.body.pin ?? ""), row.pin_hash);
  res.json({ ok });
});



// GET /api/settings/target -> { target: 0.46 }  (fraction, e.g. 0.46 = 46%)
router.get("/target", async (_req, res) => {
  const [[row]] = await pool.query(`SELECT sr_target FROM app_settings WHERE id = 1`);
  res.json({ target: Number(row?.sr_target ?? 0.46) });
});
 
// PUT /api/settings/target { target: 0.5 }
// Updates the target and clears every cached AI insight, since their
// narrative text was generated against the old target.
router.put("/target", async (req, res) => {
  const target = Number(req.body.target);
  if (!Number.isFinite(target) || target <= 0 || target > 2) {
    return res.status(400).json({ error: "target must be a positive fraction (e.g. 0.46 for 46%)." });
  }
  await pool.query(`UPDATE app_settings SET sr_target = ? WHERE id = 1`, [target]);
  await pool.query(`UPDATE months SET ai_insight = NULL, ai_insight_generated_at = NULL`);
  res.json({ ok: true, target });
});
 


module.exports = router;