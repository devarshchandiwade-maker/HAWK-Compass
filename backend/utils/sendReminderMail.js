const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendReminderMail(email, name, task, daysLeft) {
    try {
        const data = await resend.emails.send({
            from: "Compass Dashboard <hawk-compass@gozoop.com>",
            to: email,
            subject: `Reminder: "${task.title}" is due in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`,
            html: `
                <h2>Hello ${name},</h2>

                <p>This is a reminder that your task is approaching its due date.</p>

                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
                    <tr>
                        <td><b>Task</b></td>
                        <td>${task.title}</td>
                    </tr>

                    <tr>
                        <td><b>Status</b></td>
                        <td>${task.status}</td>
                    </tr>

                    <tr>
                        <td><b>Priority</b></td>
                        <td>${task.priority}</td>
                    </tr>

                    <tr>
                        <td><b>Due Date</b></td>
                        <td>${task.due_date}</td>
                    </tr>

                    <tr>
                        <td><b>Reminder</b></td>
                        <td>${daysLeft} day(s) remaining</td>
                    </tr>
                </table>

                <br>

                <p>Please complete it before the due date.</p>

                <p><b>Compass Operations Dashboard</b></p>
            `,
        });

        console.log("Reminder email sent:", data);

        return true;

    } catch (err) {
        console.error("Reminder Email Error:", err);

        return false;
    }
}

module.exports = sendReminderMail;