const jwt = require("jsonwebtoken");
const { CartModel, ProductModel, PackSizeProductModel, OfferPlansModel, PromoCodeModel, sequelize, CartItemModel, UserModel } = require("../../models");
const Joi = require("joi");
const { Op } = require("sequelize");
const geoip = require("geoip-lite");

// Cart Schema
const addOrUpdateCartSchema = Joi.object({
    user_id: Joi.number().integer().allow(null).optional(),
    name: Joi.string().max(255).allow(null).optional(),
    email: Joi.string().email().allow(null).optional(),
    country: Joi.string().max(255).allow(null).optional(),
    state: Joi.string().max(255).allow(null).optional(),
    city: Joi.string().max(255).allow(null).optional(),
    phone: Joi.string().pattern(/^[0-9]+$/).allow(null).optional(),
    address: Joi.string().allow(null).optional(),
    zip_code: Joi.string().max(20).allow(null).optional(),
    cartItems: Joi.array().items(
        Joi.object({
            product_id: Joi.number().integer().required(),
            packsize_id: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).default(1)
        })
    ).optional()
});

const removeToCartSchema = Joi.object({
    user_id: Joi.alternatives().try(Joi.number().integer(), Joi.valid(null)).optional(),
    product_id: Joi.number().integer().required(),
    packsize_id: Joi.number().integer().required(),
});

const getCart = async (req, res) => {
    try {
        const { user_id = null } = req.query;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (user_id) {
            let userDetail = await UserModel.findOne({ where: { id: user_id } });
            if (!userDetail) return res.status(404).json({ status: false, message: "User not found." });
        }
        let cartDetail = await CartModel.findOne({
            where: { [Op.or]: [user_id ? { user_id } : {}, ip ? { ip } : {}] },
            include: [
                {
                    model: CartItemModel,
                    as: "cartItems",
                    required: false,
                    include: [
                        {
                            model: ProductModel,
                            as: "product",
                            attributes: ["id", "type", "title", "images", "slug", "offer_plan_id"],
                            include: [
                                {
                                    model: OfferPlansModel,
                                    as: "offerplan",
                                    attributes: ["id", "discount", "type"]
                                }
                            ]
                        },
                        {
                            model: PackSizeProductModel,
                            as: "packsize",
                            attributes: ["id", "size", "price"]
                        }
                    ]
                },
                {
                    model: PromoCodeModel,
                    as: "promocode",
                    required: false,
                }
            ]
        });

        let subtotal = 0;
        let total = 0;
        let promoCodeDiscount = 0;
        let appliedPromoCode = null;

        const promocode = cartDetail?.promocode || null;
        const formattedCart = cartDetail?.cartItems?.map(cartItem => {
            const product = cartItem.product;
            const packSize = cartItem.packsize;
            const offerPlan = product?.offerplan;

            const originalPrice = packSize?.price || 0;
            let discount = 0;
            let finalPrice = originalPrice * cartItem.quantity;

            if (offerPlan) {
                if (offerPlan.type === "Percantage") {
                    discount = (originalPrice * offerPlan.discount) / 100;
                } else if (offerPlan.type === "Amount") {
                    discount = offerPlan.discount;
                }
                finalPrice = (originalPrice - discount) * cartItem.quantity;
            }

            subtotal += originalPrice * cartItem.quantity;
            total += finalPrice;
            if (promocode) appliedPromoCode = promocode;

            return {
                id: cartItem.id,
                packsize: packSize || null,
                product: product || null,
                quantity: cartItem.quantity,
                original_price: originalPrice * cartItem.quantity,
                discount: discount * cartItem.quantity,
                final_price: finalPrice
            };
        });

        if (appliedPromoCode) {
            promoCodeDiscount = appliedPromoCode.type === "Percantage" ? (total * appliedPromoCode.discount) / 100 : appliedPromoCode.discount;
            total -= promoCodeDiscount;
        }

        return res.json({
            status: true,
            data: formattedCart,
            subtotal: parseFloat(subtotal.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            promocode_discount: promoCodeDiscount,
            promocode: appliedPromoCode || null,
            message: "Cart fetched successfully."
        });
    } catch (error) {
        console.error("Error fetching cart:", error);
        return res.status(500).json({ status: false, message: "Error fetching cart items." });
    }
};

const addOrUpdateCart = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const { error, value } = addOrUpdateCartSchema.validate(req.body, { abortEarly: false });
        if (error) return res.status(400).json({ status: false, message: "Validation Error", errors: error.details.map(err => err.message) });
        const geo = geoip.lookup(ip);
        const { user_id = null, name, email, country, state, city, phone, address, zip_code, cartItems = [] } = value;
        const cartData = { name, email, country, state, city, phone, address, zip_code, user_id, ip, ip_detail: geo ? JSON.stringify(geo) : null };

        if (user_id) {
            let userDetail = await UserModel.findOne({ where: { id: user_id } });
            if (!userDetail) return res.status(404).json({ status: false, message: "User not found." });
        }

        // Fetch or create cart
        let cartDetail = await CartModel.findOne({
            where: { [Op.or]: [user_id ? { user_id } : {}, ip ? { ip } : {}] }
        });
        if (cartDetail) {
            await cartDetail.update(cartData, { transaction });
        } else {
            cartDetail = await CartModel.create(cartData, { transaction });
        }

        const { id: cart_id } = cartDetail;

        // Process cart items
        for (const item of cartItems) {
            const { product_id, packsize_id, quantity = 1 } = item;

            const packSize = await PackSizeProductModel.findOne({ where: { product_id, id: packsize_id } });
            if (!packSize) {
                return res.status(404).json({ status: false, message: `Product/Packsize not found for product_id: ${product_id}, packsize_id: ${packsize_id}` });
            }

            const cartItem = await CartItemModel.findOne({ where: { cart_id, product_id, packsize_id } });
            if (cartItem) {
                const newQuantity = quantity;
                const newSubtotal = (quantity * packSize.price);
                await cartItem.update({ quantity: newQuantity, subtotal: newSubtotal }, { transaction });
            } else {
                await CartItemModel.create({ cart_id, product_id, packsize_id, quantity, subtotal: quantity * packSize.price }, { transaction });
            }
        }
        await transaction.commit();
        return res.json({ status: true, message: "Cart updated successfully." });
    } catch (error) {
        await transaction.rollback();
        console.error("Error adding cart:", error);
        return res.status(500).json({ status: false, message: "Error updating cart." });
    }
};

const removeFromCart = async (req, res) => {
    let transaction = null;
    try {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const { error, value } = removeToCartSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                status: false,
                message: "Validation Error",
                errors: error.details.map(err => err.message),
            });
        }
        const { user_id = null, product_id, packsize_id } = value;
        if (user_id) {
            let userDetail = await UserModel.findOne({ where: { id: user_id } });
            if (!userDetail) return res.status(404).json({ status: false, message: "User not found." });
        }
        let cartDetail = await CartModel.findOne({ where: { [Op.or]: [user_id ? { user_id } : {}, ip ? { ip } : {}] }, });
        if (!cartDetail) return res.status(404).json({ status: false, message: "Cart not found." });
        const { id: cart_id } = cartDetail;
        const cartItem = await CartItemModel.findOne({ where: { cart_id, product_id, packsize_id } });
        if (!cartItem) return res.status(404).json({ status: false, message: "Cart item not found." });
        transaction = await sequelize.transaction();
        await cartItem.destroy({ transaction });
        await transaction.commit();
        return res.json({ status: true, message: "Cart item removed successfully." });
    } catch (error) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("Transaction rollback failed:", rollbackError);
            }
        }
        console.error("Error removing cart item:", error);
        return res.status(500).json({ status: false, message: "Error removing cart item." });
    } finally {
        if (transaction) { transaction = null; }
    }
};

const clearCart = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { user_id = null } = req.query;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (user_id) {
            let userDetail = await UserModel.findOne({ where: { id: user_id } });
            if (!userDetail) return res.status(404).json({ status: false, message: "User not found." });
        }
        let cartDetail = await CartModel.findOne({ where: { [Op.or]: [user_id ? { user_id } : {}, ip ? { ip } : {}] }, });
        if (!cartDetail) return res.status(404).json({ status: false, message: "Cart not found." });
        const { id: cart_id } = cartDetail;
        await CartItemModel.destroy({ where: { cart_id } });
        await cartDetail.destroy({ transaction });
        await transaction.commit();
        return res.json({ status: true, message: "Cart cleared successfully." });
    } catch (error) {
        await transaction.rollback();
        console.error("Error clearing cart:", error);
        return res.status(500).json({ status: false, message: "Error clearing cart." });
    }
};

const applyPromoCode = async (req, res) => {
    try {
        const { code, user_id = null } = req.body;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (user_id) {
            let userDetail = await UserModel.findOne({ where: { id: user_id } });
            if (!userDetail) return res.status(404).json({ status: false, message: "User not found." });
        }
        const currentDate = new Date();
        const promoCode = await PromoCodeModel.findOne({
            where: {
                code,
                start_date: { [Op.lte]: currentDate },
                end_date: { [Op.gte]: currentDate }
            },
            attributes: ["id", "code", "discount", "type"]
        });
        if (!promoCode) return res.status(400).json({ status: false, message: "Invalid or expired promo code." });
        const userCartItems = await CartModel.findAll({ where: { [Op.or]: [user_id ? { user_id } : {}, ip ? { ip } : {}] }, attributes: ["subtotal"] });
        if (!userCartItems || userCartItems.length === 0) return res.status(404).json({ status: false, message: "User cart detail not found." });
        const totalSubTotal = userCartItems.reduce((acc, item) => acc + parseFloat(item.subtotal || 0), 0);
        if (promoCode.type === "amount" && totalSubTotal < promoCode.discount) return res.status(400).json({ status: false, message: `Cart subtotal ($${totalSubTotal}) must be greater than the promo code discount ($${promoCode.discount}).` });
        await CartModel.update({ promocode_id: promoCode.id }, { where: { [Op.or]: [user_id ? { user_id } : {}, ip ? { ip } : {}] }, });
        res.json({ status: true, message: "Promocode applied successFully.", promoCode });
    } catch (error) {
        console.error("Error applyPromoCode:", error);
        return res.status(500).json({ status: false, message: "Error apply promo-code." });
    }
};

const removePromoCode = async (req, res) => {
    try {
        const { user_id } = req.body;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const whereCondition = { [Op.or]: [user_id ? { user_id } : {}, ip ? { ip } : {}], promocode_id: { [Op.ne]: null } };

        let existUserCartDetail = await CartModel.findOne({ where: whereCondition });
        if (!existUserCartDetail) return res.status(404).json({ status: false, message: "No applied promo code found for you." });

        await CartModel.update({ promocode_id: null }, { where: whereCondition });
        res.json({ status: true, message: "Promocode removed successFully." });
    } catch (error) {
        console.error("Error removePromoCode:", error);
        return res.status(500).json({ status: false, message: "Error remove promo-code." });
    }
};

module.exports = { getCart, addOrUpdateCart, removeFromCart, clearCart, applyPromoCode, removePromoCode };
