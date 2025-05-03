const { Op } = require("sequelize");
const { UserModel, CartModel, ProductModel, PromoCodeModel, CartItemModel, OfferPlansModel, PackSizeProductModel } = require("../models");

const getIndex = async (req, res) => {
    try {
        res.render("carts/index", { title: "Carts List" });
    } catch (error) {
        console.error("Error fetching carts getIndex:", error);
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
                    { user_id: { [Op.like]: `%${search}%` } },
                    { ip: { [Op.like]: `%${search}%` } },
                    { name: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                    { country: { [Op.like]: `%${search}%` } },
                    { phone: { [Op.like]: `%${search}%` } },
                    { created_at: { [Op.like]: `%${search}%` } }
                ],
            };
        }
        let orderBy = [["id", "DESC"]];
        if (column && order) orderBy = [[column, order.toUpperCase()]];
        const { count, rows: tableRecords } = await CartModel.findAndCountAll({
            attributes: ["id", "user_id", "ip", "name", "email", "country", "phone", "created_at"],
            where: whereCondition,
            limit,
            offset,
            order: orderBy,
        });
        res.json({
            success: true,
            data: tableRecords,
            pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, pageSize: limit },
        });
    } catch (error) {
        console.error("Error fetching cart-list:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const show = async (req, res) => {
    const { id } = req.params;
    try {
        const cartDetail = await CartModel.findOne({
            where: { id },
            include: [
                {
                    model: CartItemModel, as: "cartItems", required: false,
                    include: [
                        {
                            model: ProductModel, as: "product", attributes: ["id", "type", "title", "images", "alt_text", "slug", "offer_plan_id"],
                            include: [{ model: OfferPlansModel, as: "offerplan", attributes: ["id", "discount", "type"] }]
                        },
                        { model: PackSizeProductModel, as: "packsize", attributes: ["id", "size", "price"] }
                    ]
                },
                { model: PromoCodeModel, as: "promocode", required: false, }
            ]
        });
        if (!cartDetail) return res.status(404).send("Carts not found");

        let subtotal = 0;
        let total = 0;
        let promoCodeDiscount = 0;
        let appliedPromoCode = null;

        const promocode = cartDetail?.promocode || null;
        const cartItemsData = cartDetail?.cartItems?.map(cartItem => {
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
                ...cartItem,
                id: cartItem.id,
                packsize: packSize || null,
                product: product || null,
                original_price: originalPrice * cartItem.quantity,
                discount: discount * cartItem.quantity,
                final_price: finalPrice
            };
        });
        if (appliedPromoCode) {
            promoCodeDiscount = appliedPromoCode.type === "Percantage" ? (total * appliedPromoCode.discount) / 100 : appliedPromoCode.discount;
            total -= promoCodeDiscount;
        }
        res.render("carts/show", { title: "Edit Carts", cartDetail, cartItemsData, error: '' });
    } catch (error) {
        console.error("Error fetching cart detail show:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = { getIndex, getData, show };