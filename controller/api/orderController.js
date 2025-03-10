const Joi = require("joi");
const { OrderModel, OrderItemsModel, ProductModel, PromoCodeModel, sequelize, PackSizeProductModel } = require("../../models");
const { Op } = require("sequelize");

const OrderSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    country: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    phone: Joi.string().pattern(/^[0-9]+$/).min(8).max(15).required(),
    shipping_address: Joi.string().required(),
    zip_code: Joi.string().required(),
    total_amount: Joi.number().positive().required(),
    status: Joi.string().valid("Pending", "Processing", "Confirmed", "Delivered", "Cancelled").default("Pending"),
    payment_status: Joi.string().valid("Pending", "Paid", "Cancelled").default("Pending"),
    promocode: Joi.string().allow(null, ""),
    items: Joi.array().items(
        Joi.object({
            product_id: Joi.number().integer().required(),
            packsize_id: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).default(1),
            price: Joi.number().positive().required(),
        })
    ).min(1).required(),
    payment_detail: Joi.any()
        .custom((value, helpers) => {
            if (value === "" || value === null) return null;
            try {
                return JSON.parse(value);
            } catch (err) {
                return helpers.error("any.invalid");
            }
        })
        .default(null)
        .messages({
            "any.invalid": "payment_detail must be a valid JSON string",
        }),
});

// 🛒 Create a new order
exports.createOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const user_id = req?.user?.id;
        const currentDate = new Date();
        const { error, value } = OrderSchema.validate(req.body, { abortEarly: false });
        if (error) return res.status(400).json({ status: false, message: "Validation error", errors: error.details.map(err => err.message) });

        const { name, email, country, state, city, phone, shipping_address, zip_code, total_amount, status, payment_status, payment_detail, promocode, items } = value;
        let promoCodeDetail = null;
        if (promocode && promocode !== "") {
            promoCodeDetail = await PromoCodeModel.findOne({
                where: { code: promocode, start_date: { [Op.lte]: currentDate }, end_date: { [Op.gte]: currentDate } },
                attributes: ["id", "code", "discount", "type"]
            });
        }
        const packsizeIds = items.map(item => item.packsize_id);
        const existingPackSizes = await PackSizeProductModel.findAll({
            where: { id: packsizeIds },
            attributes: ["id"]
        });
        const existingPackSizeIds = existingPackSizes.map(p => p.id);
        const invalidPackSizes = packsizeIds.filter(id => !existingPackSizeIds.includes(id));
        if (invalidPackSizes.length > 0) {
            await transaction.rollback();
            return res.status(400).json({
                status: false,
                message: `Invalid packsize_id(s): ${JSON.stringify(invalidPackSizes)}`,
            });
        }

        // Create the order
        const newOrder = await OrderModel.create({
            user_id, name, email, country, state, city, phone, shipping_address, zip_code,
            total_amount, status, payment_status, payment_detail,
            promocode_id: promoCodeDetail?.id || null
        }, { transaction });

        // Create order items
        const orderItems = items.map(item => ({
            order_id: newOrder.id,
            product_id: item.product_id,
            packsize_id: item.packsize_id,
            quantity: item.quantity,
            price: item.price,
        }));
        await OrderItemsModel.bulkCreate(orderItems, { transaction });
        await transaction.commit();
        res.status(201).json({ message: "Order created successfully", order: newOrder, items: orderItems });
    } catch (error) {
        await transaction.rollback();
        console.error("createOrder =>", error);
        res.status(500).json({ message: "Error creating order", error: error.message });
    }
};

// 📜 Get all orders
exports.getOrders = async (req, res) => {
    try {
        const user_id = req.user?.id;
        const orders = await OrderModel.findAll({
            attributes: { exclude: ["deleted_at"] },
            include: [
                {
                    model: OrderItemsModel,
                    as: "orderItems",
                    required: false,
                    attributes: ["id", "order_id", "product_id", "packsize_id", "quantity", "price"],
                    include: [
                        { model: ProductModel, as: "productDetail", required: false, attributes: ["id", "offer_plan_id", "title", "type", "slug", "images", "availability", "most_selling"] },
                        { model: PackSizeProductModel, as: "packSizeDetail", required: false }
                    ]
                },
                { model: PromoCodeModel, as: "orderPromoCode", required: false, attributes: ["code", "discount", "type"] }
            ],
            where: { user_id },
        });
        res.json({ status: true, data: orders, message: "Get all orders successFully." });
    } catch (error) {
        console.error("getOrders =>", error);
        res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
};

// 🔍 Get order by Order ID
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user?.id;
        const orderDetail = await OrderModel.findOne({
            attributes: { exclude: ["deleted_at"] },
            include: [
                {
                    model: OrderItemsModel,
                    as: "orderItems",
                    required: false,
                    attributes: ["id", "order_id", "product_id", "packsize_id", "quantity", "price"],
                    include: [
                        { model: ProductModel, as: "productDetail", required: false, attributes: ["id", "offer_plan_id", "title", "type", "slug", "images", "availability", "most_selling"] },
                        { model: PackSizeProductModel, as: "packSizeDetail", required: false }
                    ]
                },
                { model: PromoCodeModel, as: "orderPromoCode", required: false, attributes: ["code", "discount", "type"] }
            ],
            where: { user_id, id },
        });
        if (!orderDetail) return res.status(404).json({ status: false, message: "Order not found" });
        res.json({ status: true, data: orderDetail, message: "Order retrieved successfully." });
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ status: false, message: "Error fetching order", error: error.message });
    }
};

// 🔄 Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const schema = Joi.object({
            status: Joi.string().valid("Cancelled").optional()
                .messages({
                    "any.only": "Only 'Cancelled' status updates are allowed.",
                }),
            payment_detail: Joi.object().optional(),
            payment_status: Joi.string().valid("Pending", "Paid", "Cancelled").optional()
                .messages({
                    "any.only": "Invalid payment_status value. Allowed: Pending, Paid, Cancelled.",
                }),
        });
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) return res.status(400).json({ status: false, message: error.details.map((err) => err.message).join(", ") });

        const { id } = req.params;
        const user_id = req.user?.id;
        const { status, payment_detail, payment_status } = value;

        const order = await OrderModel.findOne({ where: { id, user_id } });
        if (!order) return res.status(404).json({ status: false, message: "Order not found" });

        if (status === "Cancelled") order.status = status;
        if (payment_detail !== undefined) order.payment_detail = payment_detail;
        if (payment_status !== undefined) order.payment_status = payment_status;
        await order.save();
        res.json({ status: true, message: "Order status updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating order status", error: error.message });
    }
};