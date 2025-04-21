module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define("orders", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        user_id: { type: DataTypes.INTEGER, allowNull: true },
        ip: { type: DataTypes.STRING, allowNull: true },
        ip_detail: { type: DataTypes.TEXT, allowNull: true },
        name: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false },
        country: { type: DataTypes.STRING, allowNull: false },
        state: { type: DataTypes.STRING, allowNull: false },
        city: { type: DataTypes.STRING, allowNull: false },
        phone: { type: DataTypes.STRING, allowNull: false },
        address: { type: DataTypes.TEXT, allowNull: false },
        zip_code: { type: DataTypes.STRING, allowNull: false },
        s_name: { type: DataTypes.STRING, allowNull: true },
        s_email: { type: DataTypes.STRING, allowNull: true },
        s_country: { type: DataTypes.STRING, allowNull: true },
        s_state: { type: DataTypes.STRING, allowNull: true },
        s_city: { type: DataTypes.STRING, allowNull: true },
        s_phone: { type: DataTypes.STRING, allowNull: true },
        s_address: { type: DataTypes.TEXT, allowNull: true },
        s_zip_code: { type: DataTypes.STRING, allowNull: true },
        diffrent_address: { type: DataTypes.TEXT, allowNull: true },
        total_amount: { type: DataTypes.FLOAT, allowNull: false },
        status: {
            type: DataTypes.ENUM("Pending", "Processing", "Confirmed", "Delivered", "Cancelled"),
            defaultValue: "Pending"
        },
        payment_detail: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        payment_status: {
            type: DataTypes.ENUM("Pending", "Paid", "Cancelled"),
            defaultValue: "Pending"
        },
        promocode_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        paranoid: true,
        timestamps: true,
        underscored: true,
        deletedAt: "deleted_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
    });
    return Order;
};
