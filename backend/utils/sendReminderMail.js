const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendReminderMail(email, name, task, daysLeft) {

    await transporter.sendMail({

        from: `"Compass Dashboard" <${process.env.EMAIL_USER}>`,

        to: email,

        subject: `Reminder: "${task.title}" is due in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`,

        html: `
            <h2>Hello ${name},</h2>

            <p>This is a reminder that your task is approaching its due date.</p>

            <table border="1" cellpadding="8" cellspacing="0">

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

}

module.exports = sendReminderMail;