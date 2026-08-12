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

  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: e.message,
    });
  }
};