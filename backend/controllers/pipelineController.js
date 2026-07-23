const db=require("../db/db");

exports.getPipeline = async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM pipeline ORDER BY created_at DESC"
  );

  res.json(rows);
};

exports.addLead = async (req, res) => {
  const {
    brand_name,
    services,
    pitch,
    deal_type,
    lead_stage,
    hot_status,
    current_status,
    start_month,
    retainer_amount,
    annual_retainer_value,
    project_amount,
    total_annual_revenue,
    probability_closure,
    probabilistic_revenue,
    source_closed,
  } = req.body;

  // Check if brand already exists
const [existing] = await db.query(
  "SELECT id FROM pipeline WHERE LOWER(TRIM(brand_name)) = LOWER(TRIM(?))",
  [brand_name]
);

if (existing.length > 0) {
  return res.status(409).json({
    msg: "Lead with this brand name already exists.",
  });
}

  await db.query(
    `
    INSERT INTO pipeline (
      brand_name,
      services,
      pitch,
      deal_type,
      lead_stage,
      hot_status,
      current_status,
      start_month,
      retainer_amount,
      annual_retainer_value,
      project_amount,
      total_annual_revenue,
      probability_closure,
      probabilistic_revenue,
      source_closed
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `,
    [
      brand_name,
      services,
      pitch,
      deal_type,
      lead_stage,
      hot_status,
      current_status,
      start_month,
      retainer_amount,
      annual_retainer_value,
      project_amount,
      total_annual_revenue,
      probability_closure,
      probabilistic_revenue,
      source_closed,
    ]
  );

  const [rows] = await db.query(
    "SELECT * FROM pipeline ORDER BY created_at DESC"
  );

  res.json(rows);
};

exports.updateLead = async (req, res) => {
  const { id } = req.params;

  const {
    brand_name,
    services,
    pitch,
    deal_type,
    lead_stage,
    hot_status,
    current_status,
    start_month,
    retainer_amount,
    annual_retainer_value,
    project_amount,
    total_annual_revenue,
    probability_closure,
    probabilistic_revenue,
    source_closed,
  } = req.body;

  await db.query(
    `
    UPDATE pipeline
    SET
      brand_name=?,
      services=?,
      pitch=?,
      deal_type=?,
      lead_stage=?,
      hot_status=?,
      current_status=?,
      start_month=?,
      retainer_amount=?,
      annual_retainer_value=?,
      project_amount=?,
      total_annual_revenue=?,
      probability_closure=?,
      probabilistic_revenue=?,
      source_closed=?
    WHERE id=?
    `,
    [
      brand_name,
      services,
      pitch,
      deal_type,
      lead_stage,
      hot_status,
      current_status,
      start_month,
      retainer_amount,
      annual_retainer_value,
      project_amount,
      total_annual_revenue,
      probability_closure,
      probabilistic_revenue,
      source_closed,
      id,
    ]
  );

  const [rows] = await db.query(
    "SELECT * FROM pipeline ORDER BY created_at DESC"
  );

  res.json(rows);
};

exports.deleteLead = async (req, res) => {
  await db.query(
    "DELETE FROM pipeline WHERE id=?",
    [req.params.id]
  );

  const [rows] = await db.query(
    "SELECT * FROM pipeline ORDER BY created_at DESC"
  );

  res.json(rows);
};

exports.bulkImport = async (req, res) => {
  try {
    const rows = req.body;

    console.log(JSON.stringify(req.body, null, 2));

    for (const r of rows) {
      await db.query(
        `
        INSERT INTO pipeline (
          brand_name,
          services,
          pitch,
          deal_type,
          lead_stage,
          hot_status,
          current_status,
          start_month,
          retainer_amount,
          annual_retainer_value,
          project_amount,
          total_annual_revenue,
          probability_closure,
          probabilistic_revenue,
          source_closed
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `,
        [
          r.brand_name,
          r.services,
          r.pitch,
          r.deal_type,
          r.lead_stage,
          r.hot_status,
          r.current_status,
          r.start_month,
          r.retainer_amount,
          r.annual_retainer_value,
          r.project_amount,
          r.total_annual_revenue,
          r.probability_closure,
          r.probabilistic_revenue,
          r.source_closed,
        ]
      );
    }

    const [rowsData] = await db.query(
      "SELECT * FROM pipeline ORDER BY created_at DESC"
    );

    res.json(rowsData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};