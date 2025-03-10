module.exports = (sequelize, Sequelize, DataTypes) => {
    const CartItems = sequelize.define(
        "cart_items",
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            cart_id: { type: DataTypes.INTEGER, allowNull: false },
            product_id: { type: DataTypes.INTEGER, allowNull: false },
            packsize_id: { type: DataTypes.INTEGER, allowNull: false },
            quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
            subtotal: { type: DataTypes.FLOAT, allowNull: false }
        },
        {
            timestamps: true,
            underscored: true,
        }
    );

    return CartItems;
};
