// const nodemailer = require("nodemailer");

// console.log("EMAIL_USER:", process.env.EMAIL_USER);
// console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true, // true for 465, false for 587
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
//   connectionTimeout: 10000, // 10s to establish connection
//   greetingTimeout: 10000,
//   socketTimeout: 15000,
// });

// async function sendTaskMail(email, name, task) {
//     await transporter.sendMail({
//         from: `"Compass Dashboard" <${process.env.EMAIL_USER}>`,
//         to: email,
//         subject: `New Task Assigned: ${task.title}`,
//         html: `
//             <p>Hi <b>${name}</b>,</p>

//             <p>A new task has been assigned to you.</p>

//             <table cellspacing="0" cellpadding="6">
//                 <tr>
//                     <td><b>Task</b></td>
//                     <td>${task.title}</td>
//                 </tr>

//                 <tr>
//                     <td><b>Priority</b></td>
//                     <td>${task.priority}</td>
//                 </tr>

//                 <tr>
//                     <td><b>Due Date</b></td>
//                     <td>${task.due_date}</td>
//                 </tr>

//                 <tr>
//                     <td><b>Status</b></td>
//                     <td>${task.status}</td>
//                 </tr>
//             </table>

//             <br>

//             <p>Please complete this task before the due date.</p>

//             <p>Thank you.</p>

//             <p><b>Compass Operations Dashboard</b></p>
//         `,
//     });
// }

// module.exports = sendTaskMail;

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTaskMail(email, name, task) {
    try {
        const data = await resend.emails.send({
            from: "Compass Dashboard <onboarding@resend.dev>",
            to: email,
            subject: `Task Assigned: ${task.title}`,
            html: `
                <h2>Hello ${name},</h2>

                <p>A task has been assigned or updated.</p>

                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
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

                <p>Please login to Compass Dashboard to view the task.</p>

                <br>

                <b>Compass Dashboard</b>
            `,
        });

        console.log("Email sent:", data);

        return true;

    } catch (err) {
        console.error("Email Error:", err);

        return false;
    }
}

module.exports = sendTaskMail;