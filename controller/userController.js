const { Op } = require("sequelize");
const { UserModel } = require("../models");

const getIndex = async (req, res) => {
    try {
        res.render("users/index", { title: "Users List" });
    } catch (error) {
        console.error("Error fetching user getIndex:", error);
        res.status(500).send("Internal Server Error");
    }
};

const getData = async (req, res) => {
    try {
        let { page, limit, search, order, column } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const offset = (page - 1) * limit;

        let whereCondition = {};

        if (search) {
            whereCondition = {
                [Op.or]: [
                    { id: { [Op.like]: `%${search}%` } },
                    { name: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                    { phone: { [Op.like]: `%${search}%` } },
                    { country: { [Op.like]: `%${search}%` } },
                ],
            };
        }

        let orderBy = [["id", "DESC"]];
        if (column && order) orderBy = [[column, order.toUpperCase()]];

        const { count, rows: tableRecords } = await UserModel.findAndCountAll({
            attributes: ['id', 'name', 'email', 'phone', 'country'],
            where: whereCondition,
            limit,
            offset,
            order: orderBy,
        });

        res.json({
            success: true,
            data: tableRecords,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                pageSize: limit,
            },
        });
    } catch (error) {
        console.error("Error fetching user-list:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


module.exports = { getIndex, getData };