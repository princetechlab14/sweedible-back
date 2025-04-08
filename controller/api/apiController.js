const { CategoryModel, SubCategoryModel, BlogModel, ProductModel, SubCategoryProductModel, PackSizeProductModel, OfferPlansModel, ProductReviewModel, SettingModel, DoctorsModel } = require("../../models");
const { Op, Sequelize } = require("sequelize");
const Joi = require("joi");
const { encrypt } = require("../../services/encryptResponse");

const productReviewSchema = Joi.object({
    product_id: Joi.number().integer().required(),
    email: Joi.string().optional().allow(null, ''),
    rating: Joi.number().min(1).max(5).default(5),
    note: Joi.string().optional().allow(null, ''),
});

const categoryAll = async (req, res) => {
    try {
        const categories = await CategoryModel.findAll({
            where: { status: "Active" },
            attributes: ['id', 'name', 'image'],
            include: [{ model: SubCategoryModel, as: "subCategories", where: { status: "Active" }, attributes: ['id', 'name'], order: [["shorting", "ASC"]], required: false }],
            order: [["shorting", "ASC"]]
        });
        return res.json(encrypt({ status: true, data: categories, message: "Get all categories list successFully." }));
    } catch (error) {
        res.status(500).json(encrypt({ status: false, message: "Error fetching categories." }));
    }
};

const blogAll = async (req, res) => {
    try {
        let { page = 1, limit = 12 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;
        const { count, rows: blogs } = await BlogModel.findAndCountAll({
            attributes: ["id", "title", "slug", "images", "short_desc"],
            where: { status: "Active" },
            order: [["shorting", "ASC"]],
            limit,
            offset
        });
        return res.json(encrypt({ status: true, data: blogs, currentPage: page, totalPages: Math.ceil(count / limit), totalRecord: count, message: "Get blogs list successFully." }));
    } catch (error) {
        res.status(500).json(encrypt({ status: false, message: "Error fetching blogAll." }));
    }
};

const blogSingle = async (req, res) => {
    try {
        const { slug: identifier } = req.params;
        const blog = await BlogModel.findOne({
            attributes: ["id", "title", "slug", "images", "short_desc", "description"],
            where: { [Op.or]: [{ id: isNaN(identifier) ? null : identifier }, { slug: identifier }], status: "Active" }
        });
        if (!blog) return res.status(404).json(encrypt({ status: false, message: "Blog not found." }));
        return res.json(encrypt({ status: true, data: blog, message: "Blog fetched successfully." }));
    } catch (error) {
        res.status(500).json(encrypt({ status: false, message: "Error fetching blogSingle." }));
    }
};

const productAll = async (req, res) => {
    try {
        let { page = 1, limit = 12, sort = "created_at", availability, low_price, high_price, name } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        let whereCondition = { status: "Active" };
        let includeCondition = [];

        if (name) {
            const category = await CategoryModel.findOne({
                attributes: ["id", "name"],
                where: { name: name, status: "Active" }
            });

            if (category) {
                includeCondition.push({
                    model: SubCategoryModel,
                    through: SubCategoryProductModel,
                    attributes: ["id", "name"],
                    where: { category_id: category.id },
                    required: true
                });
            } else {
                const subcategory = await SubCategoryModel.findOne({
                    attributes: ["id", "name"],
                    where: { name: name, status: "Active" }
                });

                if (!subcategory) {
                    return res.status(404).json(encrypt({ status: false, message: "Category or Subcategory not found." }));
                }

                includeCondition.push({
                    model: SubCategoryModel,
                    through: SubCategoryProductModel,
                    attributes: ["id", "name"],
                    where: { id: subcategory.id },
                    required: true
                });
            }
        }

        if (availability && ["in_stock", "out_stock"].includes(availability)) {
            whereCondition.availability = availability;
        }

        let priceConditions = [];
        if (low_price) {
            priceConditions.push(
                Sequelize.literal(`(SELECT COALESCE(MIN(price), 0) FROM packsizes_products WHERE packsizes_products.product_id = products.id) >= ${parseFloat(low_price)}`)
            );
        }
        if (high_price) {
            priceConditions.push(
                Sequelize.literal(`(SELECT COALESCE(MIN(price), 0) FROM packsizes_products WHERE packsizes_products.product_id = products.id) <= ${parseFloat(high_price)}`)
            );
        }
        if (priceConditions.length > 0) {
            whereCondition[Sequelize.Op.and] = priceConditions;
        }

        let orderCondition = [];
        switch (sort) {
            case "best_selling":
                whereCondition.most_selling = true;
                break;
            case "newest":
                orderCondition = [["created_at", "DESC"]];
                break;
            case "price_low_to_high":
                orderCondition = [
                    [Sequelize.literal("(SELECT COALESCE(MIN(price), 0) FROM packsizes_products WHERE packsizes_products.product_id = products.id)"), "ASC"]
                ];
                break;
            case "price_high_to_low":
                orderCondition = [
                    [Sequelize.literal("(SELECT COALESCE(MIN(price), 0) FROM packsizes_products WHERE packsizes_products.product_id = products.id)"), "DESC"]
                ];
                break;
            default:
                orderCondition = [[sort, "DESC"]];
        }

        const totalProducts = await ProductModel.count({
            where: whereCondition,
            include: includeCondition
        });

        const products = await ProductModel.findAll({
            attributes: [
                "id", "title", "slug", "type", "images", "availability", "short_desc", "most_selling", "exclusive", "featured", "created_at",
                [Sequelize.literal(`(SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE product_reviews.product_id = products.id)`), "averageRating"],
                [Sequelize.literal(`(SELECT COALESCE(MIN(price), 0) FROM packsizes_products WHERE packsizes_products.product_id = products.id)`), "first_packsize_price"],
                [Sequelize.literal(`(SELECT COALESCE(MAX(price), 0) FROM packsizes_products WHERE packsizes_products.product_id = products.id)`), "last_packsize_price"]
            ],
            include: [
                ...includeCondition,
                { model: PackSizeProductModel, as: "packsizes" },
                { model: ProductReviewModel, as: "productReviews", attributes: [] }
            ],
            where: whereCondition,
            order: orderCondition,
            limit,
            offset
        });

        return res.json(encrypt({
            status: true,
            data: products,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
            message: "Products fetched successfully."
        }));

    } catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json(encrypt({ status: false, message: "Error fetching products." }));
    }
};

const productSingle = async (req, res) => {
    try {
        const { slug: identifier } = req.params;
        const products = await ProductModel.findOne({
            attributes: ["id", "title", "slug", "type", "images", "availability", "short_desc", "description", "most_selling", "exclusive", "featured"],
            where: { [Op.or]: [{ id: isNaN(identifier) ? null : identifier }, { slug: identifier }], status: "Active" },
            include: [
                {
                    model: SubCategoryModel, through: SubCategoryProductModel, attributes: ["id", "category_id", "name"],
                },
                { model: PackSizeProductModel, as: "packsizes" },
                {
                    model: ProductReviewModel,
                    as: "productReviews",
                    attributes: ["id", "email", "rating", "note", "created_at"],
                    required: false,
                    order: [["created_at", "DESC"]]
                },
                { model: OfferPlansModel, as: "offerplan", attributes: ["id", "discount", "type"], required: false, where: { status: "Active" }, order: [["shorting", "ASC"]] }
            ]
        });
        if (!products) return res.status(404).json(encrypt({ status: false, message: "Product not found." }));

        const reviews = products.productReviews || [];
        const totalReviews = reviews.length;
        const averageRating = totalReviews
            ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(2)
            : 0;

        return res.json(encrypt({
            status: true, data: {
                ...products.toJSON(),
                averageRating: parseFloat(averageRating),
                totalReviews
            }, message: "Product fetched successfully."
        }));
    } catch (error) {
        console.error("productSingle=>", error)
        res.status(500).json(encrypt({ status: false, message: "Error fetching productSingle." }));
    }
};

const searchProducts = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json(encrypt({ status: false, message: "Search query is required." }));
        }

        const products = await ProductModel.findAll({
            attributes: ["id", "title", "slug", "images", "availability", "short_desc", "most_selling", "exclusive", "featured",
                [Sequelize.literal(`(
                    SELECT COALESCE(AVG(rating), 0) 
                    FROM product_reviews 
                    WHERE product_reviews.product_id = products.id
                )`), "averageRating"],
                [Sequelize.literal(`(
                    SELECT COALESCE(MIN(price), 0) 
                    FROM packsizes_products 
                    WHERE packsizes_products.product_id = products.id
                )`), "first_packsize_price"],
                [Sequelize.literal(`(
                    SELECT COALESCE(MAX(price), 0) 
                    FROM packsizes_products 
                    WHERE packsizes_products.product_id = products.id
                )`), "last_packsize_price"]

            ],
            where: {
                status: "Active",
                [Op.or]: [
                    { title: { [Op.like]: `%${query}%` } },
                    { short_desc: { [Op.like]: `%${query}%` } },
                    { description: { [Op.like]: `%${query}%` } }
                ]
            },
            include: [
                { model: SubCategoryModel, through: SubCategoryProductModel, attributes: ["id", "name"] },
                { model: PackSizeProductModel, as: "packsizes" },
                {
                    model: ProductReviewModel,
                    as: "productReviews",
                    attributes: [],
                }
            ],
            order: [["title", "ASC"]]
        });

        if (!products.length) {
            return res.status(404).json(encrypt({ status: false, message: "No products found matching your search." }));
        }

        return res.json(encrypt({ status: true, data: products, message: "Search results fetched successfully." }));

    } catch (error) {
        console.error("Error searching products:", error);
        return res.status(500).json(encrypt({ status: false, message: "Error searching products." }));
    }
};

const home = async (req, res) => {
    try {
        const categories = await CategoryModel.findAll({
            where: { status: "Active" },
            attributes: ["id", "name", "image"],
            include: [
                {
                    model: SubCategoryModel,
                    as: "subCategories",
                    where: { status: "Active" },
                    attributes: ["id", "name"],
                    order: [["shorting", "ASC"]],
                    required: false
                }
            ],
            order: [["shorting", "ASC"]]
        });

        const products = await ProductModel.findAll({
            attributes: [
                "id", "title", "slug", "type", "images", "availability", "short_desc", "created_at", "most_selling", "exclusive", "featured",
                [Sequelize.literal(`(
                    SELECT COALESCE(AVG(rating), 0) 
                    FROM product_reviews 
                    WHERE product_reviews.product_id = products.id
                )`), "averageRating"],
                [Sequelize.literal(`(
                    SELECT COALESCE(MIN(price), 0) 
                    FROM packsizes_products 
                    WHERE packsizes_products.product_id = products.id
                )`), "first_packsize_price"],
                [Sequelize.literal(`(
                    SELECT COALESCE(MAX(price), 0) 
                    FROM packsizes_products 
                    WHERE packsizes_products.product_id = products.id
                )`), "last_packsize_price"]

            ],
            where: { status: "Active" },
            include: [
                {
                    model: ProductReviewModel,
                    as: "productReviews",
                    attributes: ['product_id', 'id', 'email', 'rating', 'note'],
                    required: false,
                },
                {
                    model: OfferPlansModel,
                    as: "offerplan",
                    required: false,
                    attributes: ["id", "discount", "type"],
                    where: { status: "Active" },
                    order: [["shorting", "ASC"]]
                }
            ],
            order: [["created_at", "DESC"]],
            subQuery: false,
        });

        const mostSellingProducts = await ProductModel.findAll({
            attributes: [
                "id", "title", "slug", "type", "images", "availability", "short_desc", "created_at", "most_selling", "exclusive", "featured",
                [Sequelize.literal(`(
                    SELECT COALESCE(AVG(rating), 0) 
                    FROM product_reviews 
                    WHERE product_reviews.product_id = products.id
                )`), "averageRating"],
                [Sequelize.literal(`(
                    SELECT COALESCE(MIN(price), 0) 
                    FROM packsizes_products 
                    WHERE packsizes_products.product_id = products.id
                )`), "first_packsize_price"],
                [Sequelize.literal(`(
                    SELECT COALESCE(MAX(price), 0) 
                    FROM packsizes_products 
                    WHERE packsizes_products.product_id = products.id
                )`), "last_packsize_price"]

            ],
            where: { status: "Active", most_selling: true },
            include: [
                {
                    model: ProductReviewModel,
                    as: "productReviews",
                    attributes: ['product_id', 'id', 'email', 'rating', 'note'],
                    required: false,
                },
                {
                    model: OfferPlansModel,
                    as: "offerplan",
                    required: false,
                    attributes: ["id", "discount", "type"],
                    where: { status: "Active" },
                    order: [["shorting", "ASC"]]
                }
            ],
            order: [["created_at", "DESC"]],
            subQuery: false,
        });

        const blogs = await BlogModel.findAll({
            attributes: ["id", "title", "slug", "images", "short_desc"],
            where: { status: "Active" },
            order: [["shorting", "ASC"]],
            limit: 4,
        });

        const exclusiveProducts = await ProductModel.findAll({
            attributes: [
                "id", "title", "slug", "type", "images", "availability", "short_desc", "created_at", "most_selling", "exclusive", "featured",
                [Sequelize.literal(`(
                    SELECT COALESCE(AVG(rating), 0) 
                    FROM product_reviews 
                    WHERE product_reviews.product_id = products.id
                )`), "averageRating"],
                [Sequelize.literal(`(
                    SELECT COALESCE(MIN(price), 0) 
                    FROM packsizes_products 
                    WHERE packsizes_products.product_id = products.id
                )`), "first_packsize_price"],
                [Sequelize.literal(`(
                    SELECT COALESCE(MAX(price), 0) 
                    FROM packsizes_products 
                    WHERE packsizes_products.product_id = products.id
                )`), "last_packsize_price"]

            ],
            where: { status: "Active", exclusive: true },
            include: [
                {
                    model: ProductReviewModel,
                    as: "productReviews",
                    attributes: ['product_id', 'id', 'email', 'rating', 'note'],
                    required: false,
                },
                {
                    model: OfferPlansModel,
                    as: "offerplan",
                    required: false,
                    attributes: ["id", "discount", "type"],
                    where: { status: "Active" },
                    order: [["shorting", "ASC"]]
                }
            ],
            order: [["created_at", "DESC"]],
            subQuery: false,
        });

        const featuredProducts = await ProductModel.findAll({
            attributes: [
                "id", "title", "slug", "type", "images", "availability", "short_desc", "created_at", "most_selling", "exclusive", "featured",
                [Sequelize.literal(`(
                    SELECT COALESCE(AVG(rating), 0) 
                    FROM product_reviews 
                    WHERE product_reviews.product_id = products.id
                )`), "averageRating"],
                [Sequelize.literal(`(
                    SELECT COALESCE(MIN(price), 0) 
                    FROM packsizes_products 
                    WHERE packsizes_products.product_id = products.id
                )`), "first_packsize_price"],
                [Sequelize.literal(`(
                    SELECT COALESCE(MAX(price), 0) 
                    FROM packsizes_products 
                    WHERE packsizes_products.product_id = products.id
                )`), "last_packsize_price"]

            ],
            where: { status: "Active", featured: true },
            include: [
                {
                    model: ProductReviewModel,
                    as: "productReviews",
                    attributes: ['product_id', 'id', 'email', 'rating', 'note'],
                    required: false,
                },
                {
                    model: OfferPlansModel,
                    as: "offerplan",
                    required: false,
                    attributes: ["id", "discount", "type"],
                    where: { status: "Active" },
                    order: [["shorting", "ASC"]]
                }
            ],
            order: [["created_at", "DESC"]],
            subQuery: false,
        });

        return res.json(encrypt({
            status: true,
            data: {
                categories,
                products,
                mostSellingProducts,
                blogs,
                exclusiveProducts,
                featuredProducts
            },
            message: "Home data fetched successfully."
        }));

    } catch (error) {
        console.error("Error fetching home data:", error);
        return res.status(500).json(encrypt({ status: false, message: "Error fetching home data." }));
    }
};

const productReview = async (req, res) => {
    try {
        const { error, value } = productReviewSchema.validate(req.body);
        if (error) {
            return res.status(400).json(encrypt({ status: false, message: error }));
        }
        await ProductReviewModel.create({ ...value });
        return res.json(encrypt({ status: true, message: "Product review added successfully." }));
    } catch (error) {
        console.error("Error product reviews:", error);
        return res.status(500).json(encrypt({ status: false, message: "Error product reviews." }));
    }
};

const settingAll = async (req, res) => {
    try {
        const settings = await SettingModel.findAll({
            attributes: ["key", "val"],
        });
        return res.json(encrypt({ status: true, data: settings, message: "Get setting list successFully." }));
    } catch (error) {
        console.error("Error settingAll:", error);
        return res.status(500).json(encrypt({ status: false, message: "Error setting list get." }));
    }
};

const doctorList = async (req, res) => {
    try {
        const doctors = await DoctorsModel.findAll({
            attributes: ["id", "name", "degree", "image", "live_status"],
            where: { status: "Active" },
            order: [["shorting", "ASC"], ["created_at", "DESC"]]
        });
        return res.json(encrypt({ status: true, data: doctors, message: "Get doctors list successFully." }));
    } catch (error) {
        console.error("Error fetching doctors list:", error);
        return res.status(500).json(encrypt({ status: false, message: "Error fetching doctors list data." }));
    }
};

const doctorSingle = async (req, res) => {
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json(encrypt({ status: false, message: "Invalid doctor ID format." }));

    try {
        const doctors = await DoctorsModel.findOne({
            attributes: ["id", "name", "degree", "image", "live_status", "description"],
            where: { status: "Active", id }
        });
        if (!doctors) return res.status(404).json(encrypt({ status: false, message: "Doctors not found." }));
        return res.json(encrypt({ status: true, data: doctors, message: "Doctors fetched successFully." }));
    } catch (error) {
        console.error("Error fetching doctors list:", error);
        return res.status(500).json(encrypt({ status: false, message: "Error fetching doctors list data." }));
    }
};
module.exports = { categoryAll, blogAll, blogSingle, productAll, productSingle, searchProducts, home, productReview, settingAll, doctorList, doctorSingle };