const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io",
    port: Number(process.env.EMAIL_PORT || 587),
    secure: String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true",
    pool: true,
    maxConnections: Number(process.env.EMAIL_POOL_MAX_CONNECTIONS || 5),
    maxMessages: Number(process.env.EMAIL_POOL_MAX_MESSAGES || 100),
    connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS || 5000),
    greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT_MS || 5000),
    socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT_MS || 10000),
    auth: {
        user: process.env.EMAIL_USER || process.env.MAILTRAP_USER,
        pass: process.env.EMAIL_PASS || process.env.MAILTRAP_PASS
    },
});

async function sendEmailNow({ to, subject, html, attachments = [] }) {
    try {
        await transporter.sendMail({
            from: `"HME Intelligence" <${process.env.EMAIL_USER || "no-reply@hme.com"}>`,
            to,
            subject,
            html,
            attachments,
        });
        console.info(`[EMAIL_SENT] to: ${to}, subject: ${subject}`);
    } catch (error) {
        console.error(`[EMAIL_FAILED] to: ${to}, error: ${error.message}`);
    }
}

async function sendEmail(message) {
    // If you want to force immediate sending based on env
    if (String(process.env.EMAIL_SEND_IMMEDIATE || "false").toLowerCase() === "true") {
        await sendEmailNow(message);
        return { queued: false };
    }

    // Default: Background sending using setImmediate
    setImmediate(() => {
        sendEmailNow(message)
            .then(() => {
                // Success log handled inside sendEmailNow
            })
            .catch((error) => {
                // Error log handled inside sendEmailNow
            });
    });

    return { queued: true };
}

module.exports = {
    sendEmail,
    sendEmailNow
};
