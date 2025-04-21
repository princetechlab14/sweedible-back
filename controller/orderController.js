const { Op } = require("sequelize");
const { OrderModel, UserModel, OrderItemsModel, ProductModel, PackSizeProductModel } = require("../models");

const getIndex = async (req, res) => {
    try {
        res.render("orders/index", { title: "Orders List" });
    } catch (error) {
        console.error("Error fetching orders getIndex:", error);
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
                    { status: { [Op.like]: `%${search}%` } },
                    { address: { [Op.like]: `%${search}%` } },
                    { total_amount: { [Op.like]: `%${search}%` } },
                    { payment_status: { [Op.like]: `%${search}%` } },
                ],
            };
        }

        let orderBy = [["created_at", "DESC"]];
        if (column && order) orderBy = [[column, order.toUpperCase()]];

        const { count, rows: tableRecords } = await OrderModel.findAndCountAll({
            attributes: ['id', 'user_id', 'address', 'total_amount', 'status', 'payment_status', 'created_at'],
            where: whereCondition,
            include: [
                {
                    model: UserModel,
                    as: "users",
                    attributes: ["email"],
                    required: false,
                },
            ],
            limit,
            offset,
            order: orderBy,
        });

        res.json({
            success: true,
            data: tableRecords,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                pageSize: limit,
            },
        });
    } catch (error) {
        console.error("Error fetching order-list:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id, status } = req.body;
        const validStatuses = ["Pending", "Processing", "Confirmed", "Delivered", "Cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }
        const order = await OrderModel.findByPk(id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        order.status = status;
        await order.save();
        res.json({ success: true, message: "Order status updated" });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const orders = await OrderModel.findByPk(id);
        if (!orders) return res.status(404).send("orders not found");
        await OrderModel.destroy({ where: { id } });
        res.redirect("/admin/orders");
    } catch (error) {
        console.error("Error deleting orders:", error);
        res.status(500).send("Internal Server Error");
    }
};

const orderItems = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await OrderModel.findByPk(id, {
            attributes: ['id', 'name', 'email', 'phone', 'address', 'city', 'state', 
                        'country', 'zip_code', 's_name', 's_address', 's_city', 
                        's_state', 's_country', 's_zip_code', 'diffrent_address',
                        'total_amount', 'status', 'payment_status', 'created_at'],
            include: [
                {
                    model: UserModel,
                    as: "users",
                    attributes: ["email"],
                    required: false,
                }
            ]
        });

        if (!order) {
            return res.status(404).send("Order not found");
        }

        const orderItems = await OrderItemsModel.findAll({
            where: { order_id: id },
            include: [
                {
                    model: ProductModel,
                    as: "products",
                    attributes: ["title"],
                },
                {
                    model: PackSizeProductModel,
                    as: "packSizeDetail",
                    attributes: ["id", "size", "price"],
                }
            ]
        });
        if (!orderItems || orderItems.length === 0) {
            return res.status(404).send("Order items not found");
        }
        res.render("orders/items", { title: "Order Items List", order, orderItems, error: "" });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = { getIndex, getData, updateStatus, deleteRecord, orderItems };