const { CategoryModel } = require("../models");
const Joi = require("joi");
const { deleteObjS3 } = require("../services/fileupload");
const { Op } = require("sequelize");

const categorySchema = Joi.object({
    name: Joi.string().required(),
    shorting: Joi.number().integer().min(0)
});

const getIndex = async (req, res) => {
    try {
        res.render("category/index", { title: "Category List" });
    } catch (error) {
        console.error("Error fetching categories:", error);
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
                    { shorting: { [Op.like]: `%${search}%` } },
                    { status: { [Op.like]: `%${search}%` } },
                ],
            };
        }
        let orderBy = [["id", "DESC"]];
        if (column && order) orderBy = [[column, order.toUpperCase()]];
        const { count, rows: tableRecords } = await CategoryModel.findAndCountAll({
            attributes: ['id', 'name', 'image', 'shorting', 'status'],
            where: whereCondition,
            limit,
            offset,
            order: orderBy
        });
        res.json({ success: true, data: tableRecords, pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, pageSize: limit } });
    } catch (error) {
        console.error("Error fetching offer plans:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const create = async (req, res) => {
    res.render("category/create", { title: "Category Create", error: "", category: {} });
};

const store = async (req, res) => {
    const { error, value } = categorySchema.validate(req.body);
    const imagePath = req.file ? req.file.location : null;
    if (error) {
        if (imagePath) await deleteObjS3(imagePath);
        return res.render("category/create", { title: "Category Create", error: error.details[0].message, category: value });
    }
    try {
        await CategoryModel.create({ ...value, image: imagePath });
        res.redirect("/admin/category");
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).send("Internal Server Error");
    }
};

const edit = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await CategoryModel.findByPk(id);
        if (!category) return res.status(404).send("Category not found");
        res.render("category/edit", { title: "Edit Category", category, error: "" });
    } catch (error) {
        console.error("Error fetching category for edit:", error);
        res.status(500).send("Internal Server Error");
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const imagePath = req.file ? req.file.location : null;
    try {
        const { error, value } = categorySchema.validate(req.body);
        const category = await CategoryModel.findByPk(id);
        if (error || !category) {
            if (imagePath) await deleteObjS3(imagePath);
            return res.render("category/edit", { title: "Edit Category", category, error: error.details[0].message });
        }
        if (imagePath && category.image) await deleteObjS3(category.image);
        await CategoryModel.update({ ...value, image: imagePath || category.image }, { where: { id } });
        res.redirect("/admin/category");
    } catch (error) {
        if (imagePath) await deleteObjS3(imagePath);
        console.error("Error updating category:", error);
        res.status(500).send("Internal Server Error");
    }
};

const deleteRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await CategoryModel.findByPk(id);
        if (!category) return res.status(404).send("Category not found");
        await CategoryModel.destroy({ where: { id } });
        res.redirect("/admin/category");
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).send("Internal Server Error");
    }
};

const changeStatus = async (req, res) => {
    const { id } = req.params;
    if (id) {
        const category = await CategoryModel.findByPk(id);
        let status;
        if (category.status == "Active") {
            status = "InActive";
        } else {
            status = "Active";
        }
        try {
            const categoryDetail = await CategoryModel.update({ status }, { where: { id } });
            if (categoryDetail) {
                res.send({ success: true });
            } else {
                res.status(500).render("error", { error: "Internal Server Error" });
            }
        } catch (error) {
            res.status(500).render("error", { error: "Internal Server Error" });
        }
    } else {
        res.status(500).render("error", { error: "Internal Server Error" });
    }
};

module.exports = {
    getIndex,
    create,
    store,
    deleteRecord,
    edit,
    update,
    changeStatus,
    getData
};
