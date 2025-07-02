const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const Handlebars = require('handlebars');
const { SettingModel } = require("../models");
const axios = require("axios");

const emailTemplateSource = fs.readFileSync(path.join(__dirname, "mailTemplates/Order.html"), "utf-8");
const template = Handlebars.compile(emailTemplateSource);

const MAIL_HOST = process.env.MAIL_HOST;
const MAIL_PORT = process.env.MAIL_PORT;
const MAIL_USERNAME = process.env.MAIL_USERNAME;
const MAIL_PASSWORD = process.env.MAIL_PASSWORD;
const MAIL_SERVICE = process.env.MAIL_SERVICE;
const EMAIL_API_URL = process.env.EMAIL_API_URL || "http://139.59.45.44:9090";

const transporter = nodemailer.createTransport(
    MAIL_SERVICE === "smtp"
        ? {
            host: MAIL_HOST,
            port: MAIL_PORT,
            secure: MAIL_PORT == 587, // True for 465, false for others (like 587)
            auth: {
                user: MAIL_USERNAME,
                pass: MAIL_PASSWORD,
            },
        } : {
            service: "gmail",
            auth: {
                user: MAIL_USERNAME,
                pass: MAIL_PASSWORD,
            },
        }
);

const sendEmails = async (orderDetails) => {
    try {
        const settingEmails = await SettingModel.findOne({ where: { key: "cc_email" } });
        let emailList = [];
        if (settingEmails && settingEmails.val) {
            emailList = settingEmails.val.split(',').map(email => email.trim());
        }
        const emailHTML = template(orderDetails);
        // let mailOptions = {
        //     from: `"Sweedible" <${MAIL_USERNAME}>`,
        //     to: orderDetails.email,
        //     cc: emailList,
        //     subject: "Payment Processing Update for Your Order",
        //     html: emailHTML,
        // };
        // let info = await transporter.sendMail(mailOptions);
        // console.log(`Email sent to ${orderDetails.email}: ${info.messageId}`);
        const payload = {
            transporterDetail: transporter,
            mailOptions: {
                from: `"Sweedible" <${MAIL_USERNAME}>`,
                to: orderDetails.email,
                cc: emailList,
                subject: "Payment Processing Update for Your Order",
                html: emailHTML,
            }
        };
        await axios.post(`${EMAIL_API_URL}/mail-sending`, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(`Error sending to ${orderDetails.email}:`, error);
    }
}
module.exports = { sendEmails };