const db = require("../db/db");

exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        name,
        email,
        photo
      FROM users
      ORDER BY name
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message,
    });
  }
};