const db = require("../db/db");

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await db.query(
            `SELECT
                id,
                name,
                email,
                photo,
                phone,
                bio
             FROM users
             WHERE id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.json(rows[0]);
    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: "Server Error",
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            name,
            phone,
            bio,
        } = req.body;

        await db.query(
            `UPDATE users
             SET
                name = ?,
                phone = ?,
                bio = ?
             WHERE id = ?`,
            [
                name,
                phone,
                bio,
                userId,
            ]
        );

        res.json({
            success: true,
            message: "Profile Updated",
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error",
        });

    }
};