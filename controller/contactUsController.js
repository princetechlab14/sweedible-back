const { Op } = require("sequelize");
const { ContactUsModel } = require("../models");

const getIndex = async (req, res) => {
    try {
        res.render("contactUs/index", { title: "ContactUs List" });
    } catch (error) {
        console.error("Error fetching contactUs getIndex:", error);
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
        const { count, rows: tableRecords } = await ContactUsModel.findAndCountAll({
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'message'],
            where: whereCondition,
            limit,
            offset,
            order: orderBy
        });
        res.json({ success: true, data: tableRecords, pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, pageSize: limit } });
    } catch (error) {
        console.error("Error fetching contactUs-list:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const contactUs = await ContactUsModel.findByPk(id);
        if (!contactUs) return res.status(404).send("ContactUs not found");
        await ContactUsModel.destroy({ where: { id } });
        res.redirect("/admin/contact-us");
    } catch (error) {
        console.error("Error deleting contact-us:", error);
        res.status(500).send("Internal Server Error");
    }
};

const show = async (req, res) => {
    const { id } = req.params;
    try {
        const contactUs = await ContactUsModel.findByPk(id);
        if (!contactUs) return res.status(404).send("ContactUs not found");
        res.render("contactUs/show", { title: "Show ContactUs", contactUs, error: "" });
    } catch (error) {
        console.error("Error fetching contactUs for show:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = { getIndex, getData, deleteRecord, show };