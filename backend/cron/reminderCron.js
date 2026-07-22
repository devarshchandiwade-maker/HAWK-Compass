const cron = require("node-cron");
const db = require("../db/db");
const sendReminderMail = require("../utils/sendReminderMail");

cron.schedule("0 9 * * *", async () => {
    console.log("Checking task reminders...");

    try {

        const [rows] = await db.query(`
    SELECT

        t.id,
        t.title,
        t.status,
        t.priority,
        t.due_date,

        u.name,
        u.email,

        n.reminder_days

    FROM tasks t

    JOIN users u
        ON u.id = t.user_id

    JOIN notification_settings n
        ON n.user_id = u.id

    WHERE
        n.notification_type = 'reminder'

        AND t.status <> 'Done'

        AND DATEDIFF(t.due_date, CURDATE()) = n.reminder_days
`);

        for(const row of rows){

            await sendReminderMail(

                row.email,

                row.name,

                row,

                row.reminder_days

            );

            console.log(

                "Reminder sent to",

                row.email

            );

        }

    } catch(err){

        console.log(err);

    }

});