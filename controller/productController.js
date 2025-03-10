const { Op } = require("sequelize");
const { ProductModel, SubCategoryModel, PackSizeProductModel, SubCategoryProductModel, sequelize, ProductReviewModel, OfferPlansModel, OrderItemsModel } = require("../models");
const { deleteObjS3 } = require("../services/fileupload");
const Joi = require("joi");

const productSchema = Joi.object({
    title: Joi.string().required(),
    type: Joi.string().allow(null).empty('').optional(),
    short_desc: Joi.string().allow(null).empty('').optional(),
    description: Joi.string().allow(null).empty('').optional(),
    shorting: Joi.number().integer().default(500).optional(),
    sub_category_id: Joi.array().items(Joi.string().required()).min(1).required(),
    size: Joi.array().items(Joi.number().required()).optional(),
    price: Joi.array().items(Joi.number().precision(2).min(0).required()).optional(),
    availability: Joi.string().valid("in_stock", "out_stock").default("in_stock"),
    most_selling: Joi.alternatives().try(Joi.boolean(), Joi.string().valid("true", "false")).default("false")
});

// Get list of products
const getIndex = async (req, res) => {
    try {
        const offersList = await OfferPlansModel.findAll();
        res.render("products/index", { offersList, title: "Products List" });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Show the create products form
const create = async (req, res) => {
    try {
        const subCategories = await SubCategoryModel.findAll({ where: { status: "Active" }, attributes: ["id", "name"] });
        res.render("products/create", { title: "Create Products", error: '', subCategories, products: {} });
    } catch (error) {
        console.error("Error fetching products create:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Store a new products
const store = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { error, value } = productSchema.validate(req.body);
        const subCategories = await SubCategoryModel.findAll({ where: { status: "Active" }, attributes: ["id", "name"] });
        const imagePaths = req.files ? req.files.map((file) => file.location) : [];
        if (error) {
            if (req.files) await Promise.all(req.files.map(async (file) => { await deleteObjS3(file.location); }));
            return res.render("products/create", { title: "Products Create", error: error.details[0].message, subCategories, products: value });
        }
        const { title, sub_category_id, size, price } = value;
        const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
        const storeData = { ...value, slug, images: imagePaths };
        const newProduct = await ProductModel.create(storeData, { transaction });
        const productId = newProduct.id;
        if (size && price && size.length === price.length) {
            const packSizeData = size.map((size, index) => ({
                product_id: productId,
                size: size,
                price: price[index],
            }));
            await PackSizeProductModel.bulkCreate(packSizeData, { transaction });
        }
        const subCategoryData = sub_category_id.map((subCategoryId) => ({
            product_id: productId,
            sub_category_id: subCategoryId,
        }));
        await SubCategoryProductModel.bulkCreate(subCategoryData, { transaction });
        await transaction.commit();
        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error creating products:", error);
        if (req.files) await Promise.all(req.files.map(async (file) => { await deleteObjS3(file.location); }));
        res.status(500).send("Internal Server Error");
    }
};

// Show the edit products form
const edit = async (req, res) => {
    const { id } = req.params;
    try {
        const products = await ProductModel.findByPk(id, {
            include: [{ model: SubCategoryModel, through: SubCategoryProductModel }, { model: PackSizeProductModel, as: "packsizes" }]
        });
        if (!products) return res.status(404).send("Products not found");
        const subCategoryIds = products.sub_categories?.map(subCategory => subCategory.id) || [];
        const subCategories = await SubCategoryModel.findAll({ where: { status: "Active" }, attributes: ["id", "name"] });
        res.render("products/edit", { title: "Edit Products", products, error: '', subCategories, subCategoryIds });
    } catch (error) {
        console.error("Error fetching products for editing:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Update the products
const update = async (req, res) => {
    const { id: productId } = req.params;
    const transaction = await sequelize.transaction();
    try {
        const product = await ProductModel.findByPk(productId, {
            include: [
                { model: SubCategoryModel, through: SubCategoryProductModel },
                { model: PackSizeProductModel, as: "packsizes" }
            ]
        });
        if (!product) return res.status(404).send("Product not found");

        const { error, value } = productSchema.validate(req.body);
        if (error) {
            const subCategories = await SubCategoryModel.findAll({
                where: { status: "Active" },
                attributes: ["id", "name"]
            });
            return res.render("products/edit", {
                title: "Product Edit",
                products: value,
                error: error.details[0].message,
                subCategories,
                subCategoryIds: product.SubCategories?.map(subCategory => subCategory.id) || []
            });
        }
        const imagePaths = req.files ? req.files.map(file => file.location) : [];
        const existingImages = product.dataValues.images || [];
        const allImages = req.files.length ? imagePaths : existingImages;
        if (req.files.length && existingImages.length) {
            existingImages.forEach(image => deleteObjS3(image));
        }
        const slug = value.title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");

        await ProductModel.update(
            { ...value, slug, images: allImages },
            { where: { id: productId }, transaction }
        );

        const existingPackSizes = await PackSizeProductModel.findAll({
            where: { product_id: productId },
            attributes: ["id", "size", "price"]
        });
        const existingPackSizeIds = existingPackSizes.map(ps => ps.id);
        const orderDependency = await OrderItemsModel.findAll({
            where: { packsize_id: existingPackSizeIds }
        });
        const usedPackSizeIds = orderDependency.map(order => order.packsize_id);
        const newPackSizes = value.size?.map((size, index) => ({
            product_id: productId,
            size,
            price: value.price[index]
        })) || [];

        for (let packSize of existingPackSizes) {
            const isUsed = usedPackSizeIds.includes(packSize.id);
            const matchingNew = newPackSizes.find(ps => ps.size == packSize.size);
            if (matchingNew) {
                await PackSizeProductModel.update(
                    { price: matchingNew.price },
                    { where: { id: packSize.id }, transaction }
                );
                newPackSizes.splice(newPackSizes.indexOf(matchingNew), 1);
            } else if (!isUsed) {
                await PackSizeProductModel.destroy({ where: { id: packSize.id }, transaction });
            }
        }
        if (newPackSizes.length > 0) {
            await PackSizeProductModel.bulkCreate(newPackSizes, { transaction });
        }
        await SubCategoryProductModel.destroy({ where: { product_id: productId }, transaction });
        if (value.sub_category_id) {
            const subCategoryData = value.sub_category_id.map(subCategoryId => ({
                product_id: productId,
                sub_category_id: subCategoryId
            }));
            await SubCategoryProductModel.bulkCreate(subCategoryData, { transaction });
        }
        await transaction.commit();
        res.redirect("/admin/products");
    } catch (error) {
        await transaction.rollback();
        console.error("Error updating product:", error);
        if (req.files) await Promise.all(req.files.map(file => deleteObjS3(file.location)));
        res.status(500).send("Internal Server Error");
    }
};

// Delete a products post
const deleteRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const products = await ProductModel.findByPk(id);
        if (!products) return res.status(404).send("Products not found");
        const image = products.images;
        if (image) await Promise.all(image.map(async (image) => { await deleteObjS3(image); }));
        await ProductModel.destroy({ where: { id: id } });
        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error deleting products:", error);
        res.status(500).send("Internal Server Error");
    }
};

const changeStatus = async (req, res) => {
    const { id } = req.params;
    if (id) {
        try {
            const detail = await ProductModel.findByPk(id);
            let status;
            if (detail.status == "Active") {
                status = "InActive";
            } else {
                status = "Active";
            }
            const update = await ProductModel.update({ status }, { where: { id } });
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

const productReview = async (req, res) => {
    const { id } = req.params;
    try {
        const productReviews = await ProductReviewModel.findAll({ where: { product_id: id } });
        res.render("products/review", { title: "Products Reviews", productReviews });
    } catch (error) {
        console.error("Error fetching productReview:", error);
        res.status(500).send("Internal Server Error");
    }
}

// Delete a products review post
const deleteProductReviewRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const products = await ProductReviewModel.findByPk(id);
        if (!products) return res.status(404).send("Products Review not found");
        await ProductReviewModel.destroy({ where: { id: id } });
        res.redirect(`/admin/products/review/${products.product_id}`);
    } catch (error) {
        console.error("Error deleting product review record:", error);
        res.status(500).send("Internal Server Error");
    }
};

const productOfferPlansUpdate = async (req, res) => {
    const { id } = req.params;
    const { offer_plan_id } = req.body;
    try {
        await ProductModel.update({ offer_plan_id }, { where: { id } });
        res.send({ success: true });
    } catch (error) {
        console.error("Error updating product offerplans record:", error);
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
                    { title: { [Op.like]: `%${search}%` } },
                    { type: { [Op.like]: `%${search}%` } },
                    { slug: { [Op.like]: `%${search}%` } },
                    { availability: { [Op.like]: `%${search}%` } },
                    { status: { [Op.like]: `%${search}%` } },
                ],
            };
        }
        let orderBy = [["id", "DESC"]];
        if (column && order) orderBy = [[column, order.toUpperCase()]];
        const { count, rows: tableRecords } = await ProductModel.findAndCountAll({
            attributes: ['id', 'offer_plan_id', 'title', 'type', 'slug', 'images', 'short_desc', 'description', 'availability', 'most_selling', 'shorting', 'status'],
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

module.exports = { getIndex, create, store, deleteRecord, edit, update, changeStatus, productReview, deleteProductReviewRecord, productOfferPlansUpdate, getData };
