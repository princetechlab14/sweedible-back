const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const Handlebars = require('handlebars');

const emailTemplateSource = fs.readFileSync(path.join(__dirname, "mailTemplates/Order.html"), "utf-8");
const template = Handlebars.compile(emailTemplateSource);

const MAIL_HOST = process.env.MAIL_HOST || 'smtp.hostinger.com';
const MAIL_PORT = process.env.MAIL_PORT || 465;
const MAIL_USERNAME = process.env.MAIL_USERNAME || 'order@medicoease.com';
const MAIL_PASSWORD = process.env.MAIL_PASSWORD || 'Tg>e!Ckt3';

const transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT, // Use 587 if not using SSL
    secure: MAIL_PORT == 587 ? false : true, // True for 465, false for 587
    auth: {
        user: MAIL_USERNAME,
        pass: MAIL_PASSWORD,
    },
});

const sendEmails = async (orderDetails) => {
    try {
        const emailHTML = template(orderDetails);
        let mailOptions = {
            from: `"Medicoease" <${MAIL_USERNAME}>`,
            to: orderDetails.email,
            subject: "Fwd: Payment Processing Update for Your Order",
            html: emailHTML,
        };
        let info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${orderDetails.email}: ${info.messageId}`);
    } catch (error) {
        console.error(`Error sending to ${orderDetails.email}:`, error);
    }
}
module.exports = { sendEmails };