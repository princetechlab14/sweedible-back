const moment = require("moment");
const { PromoCodeModel } = require("../models");
const Joi = require("joi");

const promoCodeSchema = Joi.object({
    code: Joi.string().max(100).required().trim(),
    discount: Joi.number().positive().required(),
    type: Joi.string().valid("Percantage", "Amount").required(),
    start_date: Joi.date().iso().greater(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)).required(),
    end_date: Joi.date().iso().greater(Joi.ref("start_date")).required(),
});

const getIndex = async (req, res) => {
    try {
        const promoCodes = await PromoCodeModel.findAll({ order: [["id", "DESC"]] });
        res.render("promoCodes/index", { promoCodes, title: "PromoCode List", moment });
    } catch (error) {
        console.error("Error fetching promocode:", error);
        res.status(500).send("Internal Server Error");
    }
};

const create = async (req, res) => {
    res.render("promoCodes/create", { title: "Promocode Plan Create", error: "", promoCode: {}, moment });
};

const store = async (req, res) => {
    const { error, value } = promoCodeSchema.validate(req.body);
    if (error) return res.render("promoCodes/create", { title: "Promocode Plan Create", error: error.details[0].message, promoCode: value, moment });
    try {
        await PromoCodeModel.create(value);
        res.redirect("/admin/promo-codes");
    } catch (error) {
        console.error("Error creating promo-codes:", error);
        res.status(500).send("Internal Server Error");
    }
};

const edit = async (req, res) => {
    const { id } = req.params;
    try {
        const promoCode = await PromoCodeModel.findByPk(id);
        if (!promoCode) return res.status(404).send("Promo Code not found");
        res.render("promoCodes/edit", { title: "Edit PromoCode", promoCode, error: "", moment });
    } catch (error) {
        console.error("Error fetching promo code for edit:", error);
        res.status(500).send("Internal Server Error");
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    try {
        const { error, value } = promoCodeSchema.validate(req.body);
        const promoCode = await PromoCodeModel.findByPk(id);
        if (error || !promoCode) return res.render("promoCodes/edit", { title: "Edit PromoCode", promoCode, error: error.details[0].message, moment });
        await PromoCodeModel.update(value, { where: { id } });
        res.redirect("/admin/promo-codes");
    } catch (error) {
        console.error("Error updating promo-codes:", error);
        res.status(500).send("Internal Server Error");
    }
};

const deleteRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const promoCode = await PromoCodeModel.findByPk(id);
        if (!promoCode) return res.status(404).send("PromoCode not found");
        await PromoCodeModel.destroy({ where: { id } });
        res.redirect("/admin/promo-codes");
    } catch (error) {
        console.error("Error deleting promo-codes:", error);
        res.status(500).send("Internal Server Error");
    }
};

const changeStatus = async (req, res) => {
    const { id } = req.params;
    if (id) {
        const promoCode = await PromoCodeModel.findByPk(id);
        let status;
        if (promoCode.status == "Active") {
            status = "InActive";
        } else {
            status = "Active";
        }
        try {
            const promoCodeDetail = await PromoCodeModel.update({ status }, { where: { id } });
            if (promoCodeDetail) {
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
};
