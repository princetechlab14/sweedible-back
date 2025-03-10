const { AdminModel } = require("../models");
const { hashPassword } = require("../services/passwordUtils");

const admin = async () => {
    const generated = await hashPassword("Little@2025Tech", 8);
    try {
        const insertRecords = [
            {
                email: "littlesolution3@gmail.com",
                name: "admin",
                password: generated,
                status: "active",
            },
        ];
        await AdminModel.bulkCreate(insertRecords);
    } catch (error) {
        console.error("admin seeder:", error);
    }
};
module.exports = { admin };
