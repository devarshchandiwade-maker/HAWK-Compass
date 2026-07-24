const db = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendInviteMail = require("../utils/sendInviteMail"); 

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await db.query(
            "SELECT * FROM admins WHERE email=?",
            [email]
        );

        if (!rows.length) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const admin = rows[0];

        const match = await bcrypt.compare(password, admin.password);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                type: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email
            }
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

exports.getUsers = async (req, res) => {

    try {

        const [rows] = await db.query(`

            SELECT

            u.id,
            u.name,
            u.email,
            u.photo,
            u.status,

            IFNULL(p.task_tracker,0) task_tracker,
            IFNULL(p.retainers,0) retainers,
            IFNULL(p.pipeline,0) pipeline,
            IFNULL(p.sal_ret,0) sal_ret

            FROM users u

            LEFT JOIN user_permissions p

            ON u.id=p.user_id

            ORDER BY u.name

        `);

        res.json(rows);

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success:false

        });

    }

};

exports.getUser = async (req,res)=>{

    const {id}=req.params;

    const [rows]=await db.query(

        `

        SELECT

        u.*,

        IFNULL(p.task_tracker,0) task_tracker,

        IFNULL(p.retainers,0) retainers,

        IFNULL(p.pipeline,0) pipeline,

        IFNULL(p.sal_ret,0) sal_ret

        FROM users u

        LEFT JOIN user_permissions p

        ON u.id=p.user_id

        WHERE u.id=?

        `,

        [id]

    );

    res.json(rows[0]);

}

exports.updatePermissions = async (req,res)=>{

    const {id}=req.params;

    const {

        task_tracker,

        retainers,

        pipeline,

        sal_ret

    }=req.body;

    const [rows]=await db.query(

        "SELECT * FROM user_permissions WHERE user_id=?",

        [id]

    );

    if(rows.length===0){

        await db.query(

            `

            INSERT INTO user_permissions

            (

            user_id,

            task_tracker,

            retainers,

            pipeline,

            sal_ret

            )

            VALUES(?,?,?,?,?)

            `,

            [

                id,

                task_tracker,

                retainers,

                pipeline,

                sal_ret

            ]

        );

    }

    else{

        await db.query(

            `

            UPDATE user_permissions

            SET

            task_tracker=?,

            retainers=?,

            pipeline=?,

            sal_ret=?

            WHERE user_id=?

            `,

            [

                task_tracker,

                retainers,

                pipeline,

                sal_ret,

                id

            ]

        );

    }

    res.json({

        success:true

    });

}

exports.addUser = async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and Email are required."
            });
        }

        const [exist] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (exist.length > 0) {
            return res.status(400).json({
                success: false,
                message: "User already exists."
            });
        }


        await db.query(
    `
    INSERT INTO users
    (
        google_id,
        name,
        email,
        status
    )
    VALUES
    (
        'a',
        ?,
        ?,
        'Active'
    )
    `,
    [name, email]
);

        // Fire and forget — don't let email issues block the response
        sendInviteMail(email, name).catch((err) =>
            console.error("Failed to send invite email:", err)
        );

        res.json({
            success: true,
            message: "User added successfully."
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};