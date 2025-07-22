import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const verificationEmailTemplate = `
Dear User,
Thank you for signing up.

Your verification code is: {{code}}

Please enter this code to complete your verification. This code will expire in 10 minutes.
If you didn't request this, please ignore this email.

Best regards,
Support Team
`;

const resetPasswordEmailTemplate = `
Dear User,

You requested to reset your password. Click the link below to reset your password:

Reset Password Link: {{resetLink}}

This link will expire in 30 minutes.

If you didn't request this, ignore this email.

Best regards,
Support Team
`;

const orderConfirmationEmailTemplate = `
Dear User,

Your order has been confirmed. Click the link below to view your order:

Order Details:

Order Number: {{orderNumber}}

Order Date: {{orderDate}}

Order Total: {{orderTotal}}

Best regards,
Mawal Team
`;

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASS,
            },
        });
    }

    async sendVerificationCode(to, code) {
        const mailOptions = {
            from: `"Authentication Service" <${process.env.NODEMAILER_EMAIL}>`,
            to,
            subject: "Your Verification Code",
            text: verificationEmailTemplate.replace("{{code}}", code),
        };

        return await this.transporter.sendMail(mailOptions);
    }

    async sendResetPasswordLink(to, resetLink) {
        const mailOptions = {
            from: `"Authentication Service" <${process.env.NODEMAILER_EMAIL}>`,
            to,
            subject: "Reset Your Password",
            text: resetPasswordEmailTemplate.replace("{{resetLink}}", resetLink),
        };

        return await this.transporter.sendMail(mailOptions);
    }

    async sendOtp(to, otp) {
        const mailOptions = {
            from: `"Authentication Service" <${process.env.NODEMAILER_EMAIL}>`,
            to,
            subject: "Your Verification Code",
            text: `Your verification code is: ${otp}`,
        };

        return await this.transporter.sendMail(mailOptions);
    }
}

export default new EmailService();