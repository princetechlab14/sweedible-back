const { Op } = require("sequelize");
const { OfferPlansModel } = require("../models");
const Joi = require("joi");

const offerPlanSchema = Joi.object({
    discount: Joi.string().max(200).required(),
    type: Joi.string().valid("Percantage", "Amount").default("Percantage"),
    shorting: Joi.number().integer().min(0)
});

const getIndex = async (req, res) => {
    try {
        res.render("offerPlans/index", { title: "Offer Plans List" });
    } catch (error) {
        console.error("Error fetching offer plans:", error);
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
                    { discount: { [Op.like]: `%${search}%` } },
                    { type: { [Op.like]: `%${search}%` } },
                    { shorting: { [Op.like]: `%${search}%` } },
                    { status: { [Op.like]: `%${search}%` } },
                ],
            };
        }
        let orderBy = [["id", "DESC"]];
        if (column && order) orderBy = [[column, order.toUpperCase()]];
        const { count, rows: tableRecords } = await OfferPlansModel.findAndCountAll({
            attributes: ['id', 'discount', 'type', 'shorting', 'status'],
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
    res.render("offerPlans/create", { title: "Offer Plan Create", error: "", offerPlan: {} });
};

const store = async (req, res) => {
    const { error, value } = offerPlanSchema.validate(req.body);
    if (error) return res.render("offerPlans/create", { title: "Offer Plan Create", error: error.details[0].message, offerPlan: value });
    try {
        await OfferPlansModel.create(value);
        res.redirect("/admin/offer-plans");
    } catch (error) {
        console.error("Error creating offer plans:", error);
        res.status(500).send("Internal Server Error");
    }
};

const edit = async (req, res) => {
    const { id } = req.params;
    try {
        const offerPlan = await OfferPlansModel.findByPk(id);
        if (!offerPlan) return res.status(404).send("OfferPlan not found");
        res.render("offerPlans/edit", { title: "Edit OfferPlan", offerPlan, error: "" });
    } catch (error) {
        console.error("Error fetching offer plan for edit:", error);
        res.status(500).send("Internal Server Error");
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    try {
        const { error, value } = offerPlanSchema.validate(req.body);
        const offerPlan = await OfferPlansModel.findByPk(id);
        if (error || !offerPlan) return res.render("offerPlans/edit", { title: "Edit OfferPlan", offerPlan, error: error.details[0].message });
        await OfferPlansModel.update(value, { where: { id } });
        res.redirect("/admin/offer-plans");
    } catch (error) {
        console.error("Error updating offer plans:", error);
        res.status(500).send("Internal Server Error");
    }
};

const deleteRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const offerPlan = await OfferPlansModel.findByPk(id);
        if (!offerPlan) return res.status(404).send("OfferPlan not found");
        await OfferPlansModel.destroy({ where: { id } });
        res.redirect("/admin/offer-plans");
    } catch (error) {
        console.error("Error deleting offer-plans:", error);
        res.status(500).send("Internal Server Error");
    }
};

const changeStatus = async (req, res) => {
    const { id } = req.params;
    if (id) {
        const offerPlan = await OfferPlansModel.findByPk(id);
        let status;
        if (offerPlan.status == "Active") {
            status = "InActive";
        } else {
            status = "Active";
        }
        try {
            const offerPlanDetail = await OfferPlansModel.update({ status }, { where: { id } });
            if (offerPlanDetail) {
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
