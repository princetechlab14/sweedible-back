const { Op } = require("sequelize");
const { CategoryModel, SubCategoryModel, OfferPlansModel } = require("../models");
const Joi = require("joi");

const transformEmptyStringsToNull = (obj) => {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, value === "" ? null : value])
    );
};

const subCategorySchema = Joi.object({
    category_id: Joi.number().integer().min(0).required(),
    name: Joi.string().required(),
    shorting: Joi.number().integer().min(0)
});

const getIndex = async (req, res) => {
    try {
        res.render("subCategory/index", { title: "Sub categories list." });
    } catch (error) {
        console.error("Error fetching sub-categories:", error);
        res.status(500).send("Internal Server Error");
    }
};

const create = async (req, res) => {
    try {
        const categories = await CategoryModel.findAll({ status: 'Active' });
        res.render("subCategory/create", { categories, title: "Sub Category Create", error: "" });
    } catch (error) {
        console.error("Error creating sub-categories:", error);
        res.status(500).send("Internal Server Error");
    }
};

const store = async (req, res) => {
    req.body = transformEmptyStringsToNull(req.body);
    const { error, value } = subCategorySchema.validate(req.body);
    const categories = await CategoryModel.findAll({ status: 'Active' });
    if (error) return res.render("subCategory/create", { title: "Sub Category Create", error: error.details[0].message, categories });
    try {
        await SubCategoryModel.create(value);
        res.redirect("/admin/sub-category");
    } catch (error) {
        console.error("Error creating sub-categories:", error);
        res.status(500).send("Internal Server Error");
    }
};

const edit = async (req, res) => {
    const { id } = req.params;
    try {
        const subCategory = await SubCategoryModel.findByPk(id);
        if (!subCategory) return res.status(404).send("Sub category not found");
        const categories = await CategoryModel.findAll({ status: 'Active' });
        res.render("subCategory/edit", { title: "Edit Sub Category", subCategory, error: "", categories });
    } catch (error) {
        console.error("Error fetching sub-categories for edit:", error);
        res.status(500).send("Internal Server Error");
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    try {
        const { error, value } = subCategorySchema.validate(req.body);
        const subCategory = await SubCategoryModel.findByPk(id);
        const categories = await CategoryModel.findAll({ status: 'Active' });
        if (error || !subCategory) return res.render("subCategory/edit", { title: "Edit Sub Category", subCategory, error: error.details[0].message, categories });
        await SubCategoryModel.update(value, { where: { id } });
        res.redirect("/admin/sub-category");
    } catch (error) {
        console.error("Error updating sub-categories:", error);
        res.status(500).send("Internal Server Error");
    }
};

const deleteRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const subCategory = await SubCategoryModel.findByPk(id);
        if (!subCategory) return res.status(404).send("Sub category not found");
        await SubCategoryModel.destroy({ where: { id } });
        res.redirect("/admin/sub-category");
    } catch (error) {
        console.error("Error deleting sub-categories:", error);
        res.status(500).send("Internal Server Error");
    }
};

const changeStatus = async (req, res) => {
    const { id } = req.params;
    if (id) {
        const subCategory = await SubCategoryModel.findByPk(id);
        let status;
        if (subCategory.status == "Active") {
            status = "InActive";
        } else {
            status = "Active";
        }
        try {
            const subCategoryDetail = await SubCategoryModel.update({ status }, { where: { id } });
            if (subCategoryDetail) {
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
                    { "$mainCategories.name$": { [Op.like]: `%${search}%` } }
                ],
            };
        }
        let orderBy = [["id", "DESC"]];
        if (column && order) {
            if (column === "mainCategories.name") {
                orderBy = [[{ model: CategoryModel, as: "mainCategories" }, "name", order.toUpperCase()]];
            } else {
                orderBy = [[column, order.toUpperCase()]];
            }
        }
        const { count, rows: tableRecords } = await SubCategoryModel.findAndCountAll({
            attributes: ['id', 'name', 'category_id', 'shorting', 'status'],
            where: whereCondition,
            limit,
            offset,
            include: [{ model: CategoryModel, as: "mainCategories", attributes: ['name'] }],
            order: orderBy
        });
        res.json({ success: true, data: tableRecords, pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, pageSize: limit } });
    } catch (error) {
        console.error("Error fetching offer plans:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
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
