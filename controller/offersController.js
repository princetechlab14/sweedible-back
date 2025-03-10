const { Op } = require("sequelize");
const { OfferModel } = require("../models");

const getIndex = async (req, res) => {
    try {
        res.render("offers/index", { title: "Offers List" });
    } catch (error) {
        console.error("Error fetching offers getIndex:", error);
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
            whereCondition = { [Op.or]: [{ id: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }] };
        }
        let orderBy = [["id", "DESC"]];
        if (column && order) orderBy = [[column, order.toUpperCase()]];
        const { count, rows: tableRecords } = await OfferModel.findAndCountAll({
            attributes: ['id', 'email'],
            where: whereCondition,
            limit,
            offset,
            order: orderBy
        });
        res.json({ success: true, data: tableRecords, pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, pageSize: limit } });
    } catch (error) {
        console.error("Error fetching offers-list:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { getIndex, getData };