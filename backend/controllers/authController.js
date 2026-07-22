const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const db = require("../db/db"); // your mysql connection

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {

    try {

        const { token } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        const googleId = payload.sub;
        const name = payload.name;
        const email = payload.email;
        const photo = payload.picture;

        const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
);

if (rows.length === 0) {
    return res.status(403).json({
        success: false,
        message: "You are not authorized to access this application."
    });
}

const user = rows[0];

if (user.status !== "Active") {
    return res.status(403).json({
        success: false,
        message: "Your account has been deactivated."
    });
}

await db.query(
    `
    UPDATE users
    SET
        google_id = ?,
        name = ?,
        photo = ?,
        last_login = NOW()
    WHERE id = ?
    `,
    [
        googleId,
        name,
        photo,
        user.id
    ]
);

const userId = user.id;

        const jwtToken=jwt.sign(

            {

                id:userId,

                email

            },

            process.env.JWT_SECRET,

            {

                expiresIn:"7d"

            }

        );

        res.json({

            success:true,

            token:jwtToken,

            user:{

                id:userId,

                name,

                email,

                photo

            }

        });

    } catch(err){

        console.log(err);

        res.status(500).json({

            success:false,

            message:"Login Failed"

        });

    }

}

exports.getPermissions = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        task_tracker,
        retainers,
        pipeline,
        sal_ret
      FROM user_permissions
      WHERE user_id = ?
      `,
      [userId]
    );

    if (rows.length === 0) {
      return res.json({
        task_tracker: 0,
        retainers: 0,
        pipeline: 0,
        sal_ret: 0,
      });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};