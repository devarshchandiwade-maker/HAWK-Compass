const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    family: 4,
});

// Verify SMTP connection when server starts
transporter.verify((err, success) => {
    if (err) {
        console.error("❌ SMTP Error:", err);
    } else {
        console.log("✅ SMTP Server Ready");
    }
});

async function sendTaskMail(email, name, task) {
    try {
        const info = await transporter.sendMail({
            from: `"Compass Dashboard" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Task Update: ${task.title}`,
            html: `
                <p>Hi <b>${name}</b>,</p>

                <p>Your task has been assigned or updated.</p>

                <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;">
                    <tr>
                        <td><b>Task</b></td>
                        <td>${task.title}</td>
                    </tr>

                    <tr>
                        <td><b>Priority</b></td>
                        <td>${task.priority}</td>
                    </tr>

                    <tr>
                        <td><b>Status</b></td>
                        <td>${task.status}</td>
                    </tr>

                    <tr>
                        <td><b>Due Date</b></td>
                        <td>${task.due_date || "-"}</td>
                    </tr>

                    <tr>
                        <td><b>Notes</b></td>
                        <td>${task.notes || "-"}</td>
                    </tr>
                </table>

                <br>

                <p>Please log in to the Compass Dashboard for more details.</p>

                <p>Regards,<br><b>Compass Dashboard</b></p>
            `,
        });

        console.log("✅ Email sent:", info.messageId);
        return true;
    } catch (err) {
        console.error("❌ Email Error:", err.message);
        return false;
    }
}

module.exports = sendTaskMail;