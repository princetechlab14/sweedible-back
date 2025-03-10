const { SettingModel } = require("../models");
const Joi = require("joi");

const settingSchema = Joi.object({
    key: Joi.string().required(),
    val: Joi.string().required()
});

const getIndex = async (req, res) => {
    try {
        const settings = await SettingModel.findAll();
        res.render("setting/index", { settings, title: "Setting List" });
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).send("Internal Server Error");
    }
};

const create = async (req, res) => {
    res.render("setting/create", { title: "Setting Create", error: "", setting: {} });
};

const store = async (req, res) => {
    const { error, value } = settingSchema.validate(req.body);
    if (error) {
        return res.render("setting/create", { title: "Setting Create", error: error.details[0].message, setting: value });
    }
    try {
        await SettingModel.create(value);
        res.redirect("/admin/setting");
    } catch (error) {
        console.error("Error creating setting:", error);
        res.status(500).send("Internal Server Error");
    }
};

const edit = async (req, res) => {
    const { id } = req.params;
    try {
        const setting = await SettingModel.findByPk(id);
        if (!setting) return res.status(404).send("Setting not found");
        res.render("setting/edit", { title: "Edit Setting", setting, error: "" });
    } catch (error) {
        console.error("Error fetching setting for edit:", error);
        res.status(500).send("Internal Server Error");
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    try {
        const { error, value } = settingSchema.validate(req.body);
        const setting = await SettingModel.findByPk(id);
        if (error || !setting) return res.render("setting/edit", { title: "Edit Setting", setting, error: error.details[0].message });
        await SettingModel.update(value, { where: { id } });
        res.redirect("/admin/setting");
    } catch (error) {
        console.error("Error updating setting:", error);
        res.status(500).send("Internal Server Error");
    }
};

const deleteRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const setting = await SettingModel.findByPk(id);
        if (!setting) return res.status(404).send("Setting not found");
        await SettingModel.destroy({ where: { id } });
        res.redirect("/admin/setting");
    } catch (error) {
        console.error("Error deleting setting:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    getIndex,
    create,
    store,
    deleteRecord,
    edit,
    update
};
