const { BlogModel } = require("../models");
const { deleteObjS3 } = require("../services/fileupload");
const Joi = require("joi");

const blogSchema = Joi.object({
    title: Joi.string().required(),
    short_desc: Joi.string().required(),
    description: Joi.string().required(),
    shorting: Joi.number().integer().optional(),
});

// Get list of blogs
const getIndex = async (req, res) => {
    try {
        res.render("blog/index", { title: "Blogs List" });
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Show the create blog form
const create = async (req, res) => {
    try {
        res.render("blog/create", { title: "Create Blog", error: '' });
    } catch (error) {
        console.error("Error fetching blogs create:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Store a new blog
const store = async (req, res) => {
    try {
        const { error, value } = blogSchema.validate(req.body);
        if (error) return res.render("blog/create", { title: "Blog Create", error: error.details[0].message });
        const imagePaths = req.files ? req.files.map((file) => file.location) : [];
        const slug = value.title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
        const newBlog = { ...value, slug, images: imagePaths };
        await BlogModel.create(newBlog);
        res.redirect("/admin/blogs");
    } catch (error) {
        console.error("Error creating blog:", error);
        if (req.files) await Promise.all(req.files.map(async (file) => { await deleteObjS3(file.location); }));
        res.status(500).send("Internal Server Error");
    }
};

// Show the edit blog form
const edit = async (req, res) => {
    const { id } = req.params;
    try {
        const blog = await BlogModel.findByPk(id);
        if (!blog) return res.status(404).send("Blog not found");
        res.render("blog/edit", { title: "Edit Blog", blog, error: '' });
    } catch (error) {
        console.error("Error fetching blog for editing:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Update the blog
const update = async (req, res) => {
    const { id: blogId } = req.params;
    try {
        const blog = await BlogModel.findByPk(blogId);
        if (!blog) return res.status(404).send("Blog not found");
        const { error, value } = blogSchema.validate(req.body);
        if (error) return res.render("blog/edit", { title: "Blog Edit", blog, error: error.details[0].message, });

        // Handle new image uploads
        const imagePaths = req.files ? req.files.map((file) => file.location) : [];
        const existingBlog = await BlogModel.findByPk(blogId);
        if (!existingBlog) {
            if (req.files) await Promise.all(req.files.map(async (file) => { await deleteObjS3(file.location); }));
            return res.status(404).send("Blog not found");
        }
        // Create slug based on the title
        const slug = value.title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
        const existing = existingBlog.dataValues.images;
        if (existing.length !== 0 && req.files.length !== 0) {
            existing?.forEach((image) => { deleteObjS3(image); });
        }
        const allImages = req.files.length !== 0 ? imagePaths : existing;
        const updatedBlog = { ...value, slug, images: allImages };
        await BlogModel.update(updatedBlog, { where: { id: blogId } });
        res.redirect(`/admin/blogs`);
    } catch (error) {
        console.error("Error updating blog:", error);
        if (req.files) await Promise.all(req.files.map(async (file) => { await deleteObjS3(file.location); }));
        res.status(500).send("Internal Server Error");
    }
};

// Delete a blog post
const deleteRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const blog = await BlogModel.findByPk(id);
        if (!blog) return res.status(404).send("Blog not found");
        const image = blog.images;
        if (image) await Promise.all(image.map(async (image) => { await deleteObjS3(image); }));
        await BlogModel.destroy({ where: { id: id } });
        res.redirect("/admin/blogs");
    } catch (error) {
        console.error("Error deleting blog:", error);
        res.status(500).send("Internal Server Error");
    }
};

const changeStatus = async (req, res) => {
    const { id } = req.params;
    if (id) {
        const detail = await BlogModel.findByPk(id);
        let status;
        if (detail.status == "Active") {
            status = "InActive";
        } else {
            status = "Active";
        }
        try {
            const update = await BlogModel.update({ status }, { where: { id } });
            if (update) {
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
                    { title: { [Op.like]: `%${search}%` } },
                    { slug: { [Op.like]: `%${search}%` } },
                    { short_desc: { [Op.like]: `%${search}%` } },
                    { shorting: { [Op.like]: `%${search}%` } },
                    { status: { [Op.like]: `%${search}%` } },
                ],
            };
        }
        let orderBy = [["id", "DESC"]];
        if (column && order) orderBy = [[column, order.toUpperCase()]];
        const { count, rows: tableRecords } = await BlogModel.findAndCountAll({
            attributes: ['id', 'title', 'slug', 'short_desc', 'shorting', 'status'],
            where: whereCondition,
            limit,
            offset,
            order: orderBy
        });
        res.json({ success: true, data: tableRecords, pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, pageSize: limit } });
    } catch (error) {
        console.error("Error fetching blog-list:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { getIndex, create, store, deleteRecord, edit, update, changeStatus, getData };
