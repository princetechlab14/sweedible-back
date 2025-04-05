const { SettingModel } = require("../models");

const settings = async () => {
    try {
        const insertRecords = [
            { "key": "paypal_link", "val": "https://paypal.me/bharatcomputer" },
            { "key": "cc_email", "val": "kishankevadiya01@gmail.com,dharmikdungrani9@gmail.com" },
        ];
        await SettingModel.bulkCreate(insertRecords);
    } catch (error) {
        console.error("seeting seeder:", error);
    }
};
module.exports = { settings };
