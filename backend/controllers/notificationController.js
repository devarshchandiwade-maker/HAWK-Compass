const db = require("../db/db");

exports.getNotificationSettings = async (req, res) => {

    try {

        const userId = req.user.id;

        const [rows] = await db.query(

            `SELECT notification_type, reminder_days
             FROM notification_settings
             WHERE user_id=?`,

            [userId]

        );

        if(rows.length===0){

            await db.query(

                `INSERT INTO notification_settings
                (user_id)
                VALUES(?)`,

                [userId]

            );

            return res.json({

                notification_type:"updates",

                reminder_days:1

            });

        }

        res.json(rows[0]);

    } catch(err){

        console.log(err);

        res.status(500).json({

            message:"Server Error"

        });

    }

};

exports.updateNotificationSettings = async (req,res)=>{

    try{

        const userId=req.user.id;

        const{

            notification_type,

            reminder_days

        }=req.body;

        await db.query(

            `UPDATE notification_settings

            SET

            notification_type=?,

            reminder_days=?

            WHERE user_id=?`,

            [

                notification_type,

                reminder_days,

                userId

            ]

        );

        res.json({

            success:true

        });

    }catch(err){

        console.log(err);

        res.status(500).json({

            message:"Server Error"

        });

    }

};