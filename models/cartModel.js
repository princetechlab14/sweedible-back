module.exports = (sequelize, Sequelize, DataTypes) => {
    const Cart = sequelize.define(
        "cart",
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            user_id: { type: DataTypes.INTEGER, allowNull: true },
            ip: { type: DataTypes.STRING, allowNull: true },
            ip_detail: { type: DataTypes.TEXT, allowNull: true },
            name: { type: DataTypes.STRING, allowNull: true },
            email: { type: DataTypes.STRING, allowNull: true },
            country: { type: DataTypes.STRING, allowNull: true },
            state: { type: DataTypes.STRING, allowNull: true },
            city: { type: DataTypes.STRING, allowNull: true },
            phone: { type: DataTypes.STRING, allowNull: true },
            address: { type: DataTypes.TEXT, allowNull: true },
            zip_code: { type: DataTypes.STRING, allowNull: true },
            promocode_id: { type: DataTypes.INTEGER, allowNull: true },
            subtotal: { type: DataTypes.FLOAT, allowNull: true }
        },
        {
            timestamps: true,
            underscored: true,
        }
    );

    return Cart;
};
