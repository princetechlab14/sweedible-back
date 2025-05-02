const Joi = require("joi");
const { OrderModel, OrderItemsModel, ProductModel, PromoCodeModel, sequelize, PackSizeProductModel, OfferPlansModel } = require("../../models");
const { Op } = require("sequelize");
const orderService = require("../../services/orderService");
const geoip = require("geoip-lite");
const { encrypt } = require("../../services/encryptResponse");

const OrderSchema = Joi.object({
    user_id: Joi.number().integer().allow(null).optional(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    country: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    phone: Joi.string().pattern(/^[0-9]+$/).min(8).max(15).required(),
    address: Joi.string().required(),
    zip_code: Joi.string().required(),
    diffrent_address: Joi.boolean().default(false),
    s_name: Joi.string().when('diffrent_address', { is: true, then: Joi.required(), otherwise: Joi.optional().allow('') }),
    s_email: Joi.string().email().when('diffrent_address', { is: true, then: Joi.required(), otherwise: Joi.optional().allow('') }),
    s_country: Joi.string().when('diffrent_address', { is: true, then: Joi.required(), otherwise: Joi.optional().allow('') }),
    s_state: Joi.string().when('diffrent_address', { is: true, then: Joi.required(), otherwise: Joi.optional().allow('') }),
    s_city: Joi.string().when('diffrent_address', { is: true, then: Joi.required(), otherwise: Joi.optional().allow('') }),
    s_phone: Joi.string().pattern(/^[0-9]+$/).min(8).max(15).when('diffrent_address', { is: true, then: Joi.required(), otherwise: Joi.optional().allow('') }),
    s_address: Joi.string().when('diffrent_address', { is: true, then: Joi.required(), otherwise: Joi.optional().allow('') }),
    s_zip_code: Joi.string().when('diffrent_address', { is: true, then: Joi.required(), otherwise: Joi.optional().allow('') }),
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
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const currentDate = new Date();
        const { error, value } = OrderSchema.validate(req.body, { abortEarly: false });
        if (error) return res.status(400).json(encrypt({ status: false, message: "Validation error", errors: error.details.map(err => err.message) }));

        const { user_id = null, name, email, country, state, city, phone, address, zip_code, total_amount, status, payment_status, payment_detail, promocode, items, diffrent_address, s_name, s_email, s_country, s_state, s_city, s_phone, s_address, s_zip_code } = value;
        // Fetch promo code details if applied
        let promoCodeDetail = null;
        if (promocode && promocode !== "") {
            promoCodeDetail = await PromoCodeModel.findOne({
                where: { code: promocode, start_date: { [Op.lte]: currentDate }, end_date: { [Op.gte]: currentDate } },
                attributes: ["id", "code", "discount", "type"]
            });
        }
        // Fetch valid pack sizes and prices
        const packsizeIds = items.map(item => item.packsize_id);
        const packSizeDetails = await PackSizeProductModel.findAll({
            where: { id: packsizeIds },
            attributes: ["id", "product_id", "size", "price"]
        });

        const packSizeMap = new Map(packSizeDetails.map(p => [p.id, p]));

        const invalidPackSizes = packsizeIds.filter(id => !packSizeMap.has(id));
        if (invalidPackSizes.length > 0) {
            await transaction.rollback();
            return res.status(400).json(encrypt({ status: false, message: `Invalid packsize_id(s): ${JSON.stringify(invalidPackSizes)}` }));
        }

        // Fetch product details with offer plans
        const productIds = items.map(item => item.product_id);
        const productDetails = await ProductModel.findAll({
            where: { id: productIds },
            attributes: ["id", "offer_plan_id", "title"],
            include: [{ model: OfferPlansModel, as: "offerplan", required: false, attributes: ["id", "discount", "type"] }]
        });

        const productMap = new Map(productDetails.map(p => [p.id, p]));

        // Calculate total price based on pack size price and offer plans
        let calculatedTotal = 0;
        let orderItems = items.map(item => {
            let packSize = packSizeMap.get(item.packsize_id);
            let product = productMap.get(item.product_id);
            if (!packSize || !product) throw new Error(`Invalid product or packsize for product_id ${item.product_id}`);

            let finalPrice = packSize.price;
            if (product?.offerplan) {
                if (product.offerplan.type === "Percantage") {
                    finalPrice -= (finalPrice * product.offerplan.discount) / 100;
                } else if (product.offerplan.type === "Amount") {
                    finalPrice -= product.offerplan.discount;
                }
            }
            calculatedTotal += finalPrice * item.quantity;
            return {
                order_id: null,
                product_id: item.product_id,
                packsize_id: item.packsize_id,
                quantity: item.quantity,
                price: finalPrice
            };
        });

        // Apply Promo Code Discount
        let promoCodeDiscount = 0;
        if (promoCodeDetail) {
            if (promoCodeDetail.type === "Percantage") {
                promoCodeDiscount = (calculatedTotal * promoCodeDetail.discount) / 100;
            } else if (promoCodeDetail.type === "Amount") {
                promoCodeDiscount = promoCodeDetail.discount;
            }
        }
        let shipping_charge = (calculatedTotal > 199 ? 0.00 : 25.00);
        let grandTotal = calculatedTotal - promoCodeDiscount + shipping_charge;

        // Create the order
        const geo = geoip.lookup(ip);
        const newOrder = await OrderModel.create({
            user_id, name, email, country, state, city, phone, address, zip_code,
            total_amount: calculatedTotal, status, payment_status, payment_detail,
            promocode_id: promoCodeDetail?.id || null, diffrent_address, s_name, s_email, s_country, s_state, s_city, s_phone, s_address, s_zip_code, ip, ip_detail: geo ? JSON.stringify(geo) : null
        }, { transaction });
        orderItems = orderItems.map(item => ({ ...item, order_id: newOrder.id }));
        await OrderItemsModel.bulkCreate(orderItems, { transaction });

        let orderItemsDetail = items.map(item => {
            let packSize = packSizeMap.get(item.packsize_id);
            let product = productMap.get(item.product_id);
            return { ...item, title: product.title, size: packSize.size, price: packSize.price, total_price: packSize.price * item.quantity };
        });
        const OrderDetailSendMail = { id: newOrder.id, name, email, country, state, city, phone, address, zip_code, promo_code_discount: promoCodeDiscount.toFixed(2), grand_total: grandTotal.toFixed(2), orderItems: orderItemsDetail, order_date: new Date().toDateString(), payment_link: '', sub_total: calculatedTotal.toFixed(2), shipping_charge, diffrent_address, s_name, s_email, s_country, s_state, s_city, s_phone, s_address, s_zip_code };
        orderService.createOrder(OrderDetailSendMail);
        await transaction.commit();
        return res.status(201).json(encrypt({ status: true, message: "Order created successfully", orderDetail: orderItems }));
    } catch (err) {
        if (transaction.finished !== "commit") await transaction.rollback();
        console.error("Order Creation Error:", err);
        return res.status(500).json(encrypt({ status: false, message: "Internal Server Error" }));
    }
};

// 📜 Get all orders
exports.getOrders = async (req, res) => {
    try {
        const { user_id = null } = req.query;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const orders = await OrderModel.findAll({
            attributes: { exclude: ["deleted_at"] },
            include: [
                {
                    model: OrderItemsModel,
                    as: "orderItems",
                    required: false,
                    attributes: ["id", "order_id", "product_id", "packsize_id", "quantity", "price"],
                    include: [
                        { model: ProductModel, as: "productDetail", required: false, attributes: ["id", "offer_plan_id", "title", "type", "slug", "images", "alt_text", "availability", "most_selling"] },
                        { model: PackSizeProductModel, as: "packSizeDetail", required: false }
                    ]
                },
                { model: PromoCodeModel, as: "orderPromoCode", required: false, attributes: ["code", "discount", "type"] }
            ],
            where: { [Op.or]: [user_id ? { user_id } : {}, ip ? { ip } : {}] },
            order: [["created_at", "desc"]]
        });
        return res.json(encrypt({ status: true, data: orders, message: "Get all orders successFully." }));
    } catch (error) {
        console.error("getOrders =>", error);
        return res.status(500).json(encrypt({ message: "Error fetching orders", error: error.message }));
    }
};

// 🔍 Get order by Order ID
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id = null } = req.query;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const orderDetail = await OrderModel.findOne({
            attributes: { exclude: ["deleted_at"] },
            include: [
                {
                    model: OrderItemsModel,
                    as: "orderItems",
                    required: false,
                    attributes: ["id", "order_id", "product_id", "packsize_id", "quantity", "price"],
                    include: [
                        { model: ProductModel, as: "productDetail", required: false, attributes: ["id", "offer_plan_id", "title", "type", "slug", "images", "alt_text", "availability", "most_selling"] },
                        { model: PackSizeProductModel, as: "packSizeDetail", required: false }
                    ]
                },
                { model: PromoCodeModel, as: "orderPromoCode", required: false, attributes: ["code", "discount", "type"] }
            ],
            where: { id, [Op.or]: [user_id ? { user_id } : {}, ip ? { ip } : {}] },
        });
        if (!orderDetail) return res.status(404).json(encrypt({ status: false, message: "Order not found" }));
        return res.json(encrypt({ status: true, data: orderDetail, message: "Order retrieved successfully." }));
    } catch (error) {
        console.error("Error fetching order:", error);
        return res.status(500).json(encrypt({ status: false, message: "Error fetching order", error: error.message }));
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
        if (error) return res.status(400).json(encrypt({ status: false, message: error.details.map((err) => err.message).join(", ") }));

        const { id } = req.params;
        const { user_id = null } = req.query;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const { status, payment_detail, payment_status } = value;

        const order = await OrderModel.findOne({ where: { id, [Op.or]: [user_id ? { user_id } : {}, ip ? { ip } : {}] } });
        if (!order) return res.status(404).json(encrypt({ status: false, message: "Order not found" }));

        if (status === "Cancelled") order.status = status;
        if (payment_detail !== undefined) order.payment_detail = payment_detail;
        if (payment_status !== undefined) order.payment_status = payment_status;
        await order.save();
        return res.json(encrypt({ status: true, message: "Order status updated successfully" }));
    } catch (error) {
        return res.status(500).json(encrypt({ message: "Error updating order status", error: error.message }));
    }
};