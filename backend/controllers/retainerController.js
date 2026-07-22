const db = require("../db/db");

exports.getRetainers = async (req,res)=>{

    const [rows] = await db.query(
        "SELECT * FROM retainers ORDER BY created_at DESC"
    );

    res.json(rows);
};

exports.addRetainer = async(req,res)=>{

    const {
        client,
        amount,
        start_date,
        end_date,
        status
    } = req.body;

    await db.query(

        `INSERT INTO retainers
        (client,amount,start_date,end_date,status)
        VALUES(?,?,?,?,?)`,

        [
            client,
            amount,
            start_date,
            end_date,
            status
        ]

    );

    const [rows] = await db.query(
        "SELECT * FROM retainers ORDER BY created_at DESC"
    );

    res.json(rows);
};

exports.updateRetainer = async(req,res)=>{

    const {id}=req.params;

    const {
        client,
        amount,
        start_date,
        end_date,
        status
    }=req.body;

    await db.query(

        `UPDATE retainers
        SET
        client=?,
        amount=?,
        start_date=?,
        end_date=?,
        status=?
        WHERE id=?`,

        [
            client,
            amount,
            start_date,
            end_date,
            status,
            id
        ]

    );

    const [rows] = await db.query(
        "SELECT * FROM retainers ORDER BY created_at DESC"
    );

    res.json(rows);
};

exports.deleteRetainer = async(req,res)=>{

    await db.query(
        "DELETE FROM retainers WHERE id=?",
        [req.params.id]
    );

    const [rows] = await db.query(
        "SELECT * FROM retainers ORDER BY created_at DESC"
    );

    res.json(rows);
};

exports.clearRetainers = async (req, res) => {
  try {
    await db.query("DELETE FROM retainers");

    const [rows] = await db.query(
      `SELECT
        id,
        client,
        amount,
        start_date AS startDate,
        end_date AS endDate,
        status
      FROM retainers
      ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};