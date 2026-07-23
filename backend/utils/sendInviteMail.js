const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const DASHBOARD_URL = "https://hawk-compass.up.railway.app/";

/**
 * @param {string} email
 * @param {string} name
 */
async function sendInviteMail(email, name) {
    try {
        const data = await resend.emails.send({
            from: "Compass Dashboard <hawk-compass@gozoop.com>",
            to: email,
            subject: "You've been invited to Compass Dashboard",
            html: `
                <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
                    <div style="background: linear-gradient(135deg, #78c84d, #48ca02); padding: 24px 32px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Compass Dashboard</h1>
                    </div>

                    <div style="border: 1px solid #e5e5e5; border-top: none; padding: 32px; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 15px; line-height: 1.6;">Hi <b>${name}</b>,</p>

                        <p style="font-size: 15px; line-height: 1.6;">
                            You've been invited to join <b>Compass Dashboard</b>. Your account has been created and you can log in using this email address to access your tasks, retainers, and pipeline updates.
                        </p>

                        <table cellspacing="0" cellpadding="6" style="font-size: 14px; margin: 16px 0;">
                            <tr>
                                <td><b>Login Email</b></td>
                                <td>${email}</td>
                            </tr>
                        </table>

                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${DASHBOARD_URL}"
                               style="background: linear-gradient(135deg, #78c84d, #48ca02); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">
                                Go to Dashboard
                            </a>
                        </div>

                        <p style="font-size: 13px; color: #666; line-height: 1.6;">
                            If the button above doesn't work, copy and paste this link into your browser:<br>
                            <a href="${DASHBOARD_URL}" style="color: #2D6CF6;">${DASHBOARD_URL}</a>
                        </p>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">

                        <p style="font-size: 13px; color: #999; line-height: 1.6;">
                            If you weren't expecting this invitation, you can safely ignore this email.
                        </p>

                        <p style="font-size: 14px; margin-top: 24px;"><b>Compass Dashboard</b></p>
                    </div>
                </div>
            `,
        });

        console.log("Invite email sent:", data);
        return true;
    } catch (err) {
        console.error("Invite Email Error:", err);
        return false;
    }
}

module.exports = sendInviteMail;