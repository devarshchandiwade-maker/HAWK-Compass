const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendTaskMail(email, name, task) {
    await transporter.sendMail({
        from: `"Compass Dashboard" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `New Task Assigned: ${task.title}`,
        html: `
            <p>Hi <b>${name}</b>,</p>

            <p>A new task has been assigned to you.</p>

            <table cellspacing="0" cellpadding="6">
                <tr>
                    <td><b>Task</b></td>
                    <td>${task.title}</td>
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
                    <td><b>Status</b></td>
                    <td>${task.status}</td>
                </tr>
            </table>

            <br>

            <p>Please complete this task before the due date.</p>

            <p>Thank you.</p>

            <p><b>Compass Operations Dashboard</b></p>
        `,
    });
}

module.exports = sendTaskMail;