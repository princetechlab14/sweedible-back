const { DoctorsModel } = require("../models");
const Joi = require("joi");
const { deleteObjS3 } = require("../services/fileupload");
const { Op } = require("sequelize");
const slugify = require("slugify");
const { v4: uuidv4 } = require("uuid");

const doctorSchema = Joi.object({
    name: Joi.string().required(),
    degree: Joi.string().optional(),
    description: Joi.string().optional(),
    shorting: Joi.number().integer().min(0),
});

const getIndex = async (req, res) => {
    try {
        res.render("doctors/index", { title: "Doctors List" });
    } catch (error) {
        console.error("Error fetching doctors:", error);
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
                    { room_id: { [Op.like]: `%${search}%` } },
                    { degree: { [Op.like]: `%${search}%` } },
                    { live_status: { [Op.like]: `%${search}%` } },
                    { shorting: { [Op.like]: `%${search}%` } },
                    { status: { [Op.like]: `%${search}%` } },
                ],
            };
        }

        let orderBy = [["id", "DESC"]];
        if (column && order) orderBy = [[column, order.toUpperCase()]];
        const { count, rows: tableRecords } = await DoctorsModel.findAndCountAll({
            attributes: ['id', 'name', 'degree', 'room_id', 'image', 'description', 'live_status', 'shorting', 'status'],
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
    res.render("doctors/create", { title: "Doctors Create", error: "", doctors: {} });
};

const store = async (req, res) => {
    const { error, value } = doctorSchema.validate(req.body);
    const imagePath = req.file ? req.file.location : null;
    if (error) {
        if (imagePath) await deleteObjS3(imagePath);
        return res.render("doctors/create", { title: "Doctors Create", error: error.details[0].message, doctors: value });
    }
    const room_id = slugify(value.name, { lower: true, strict: true }) + "-" + uuidv4().slice(0, 6);
    try {
        await DoctorsModel.create({ ...value, image: imagePath, room_id });
        res.redirect("/admin/doctors");
    } catch (error) {
        console.error("Error creating doctors:", error);
        res.status(500).send("Internal Server Error");
    }
};

const edit = async (req, res) => {
    const { id } = req.params;
    try {
        const doctors = await DoctorsModel.findByPk(id);
        if (!doctors) return res.status(404).send("Doctors not found");
        res.render("doctors/edit", { title: "Edit Doctors", doctors, error: "" });
    } catch (error) {
        console.error("Error fetching doctors for edit:", error);
        res.status(500).send("Internal Server Error");
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const imagePath = req.file ? req.file.location : null;
    try {
        const { error, value } = doctorSchema.validate(req.body);
        const doctors = await DoctorsModel.findByPk(id);
        if (error || !doctors) {
            if (imagePath) await deleteObjS3(imagePath);
            return res.render("doctors/edit", { title: "Edit Doctors", doctors, error: error.details[0].message });
        }
        if (imagePath && doctors.image) await deleteObjS3(doctors.image);
        const room_id = slugify(value.name, { lower: true, strict: true }) + "-" + uuidv4().slice(0, 6);
        await DoctorsModel.update({ ...value, image: imagePath || doctors.image, room_id }, { where: { id } });
        res.redirect("/admin/doctors");
    } catch (error) {
        if (imagePath) await deleteObjS3(imagePath);
        console.error("Error updating doctors:", error);
        res.status(500).send("Internal Server Error");
    }
};

const deleteRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const doctors = await DoctorsModel.findByPk(id);
        if (!doctors) return res.status(404).send("Doctors not found");
        await DoctorsModel.destroy({ where: { id } });
        res.redirect("/admin/doctors");
    } catch (error) {
        console.error("Error deleting doctors:", error);
        res.status(500).send("Internal Server Error");
    }
};

const changeStatus = async (req, res) => {
    const { id } = req.params;
    if (id) {
        const doctors = await DoctorsModel.findByPk(id);
        let status;
        if (doctors.status == "Active") {
            status = "InActive";
        } else {
            status = "Active";
        }
        try {
            const doctorsDetail = await DoctorsModel.update({ status }, { where: { id } });
            if (doctorsDetail) {
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

const changeLiveStatus = async (req, res) => {
    const { id } = req.params;
    const { live_status = 'Offline' } = req.body;
    try {
        await DoctorsModel.update({ live_status: live_status || 'Offline' }, { where: { id } });
        res.send({ success: true });
    } catch (error) {
        console.error("Error updating doctors live status record:", error);
        res.status(500).send("Internal Server Error");
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
    getData,
    changeLiveStatus
};
