module.exports = (sequelize, Sequelize, DataTypes) => {
    const PackSizesProducts = sequelize.define(
        "packsizes_products",
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            product_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            size: {
                type: DataTypes.INTEGER,
                defaultValue: 1,
            },
            price: {
                type: DataTypes.FLOAT,
                defaultValue: 1.00,
                allowNull: false,
                validate: {
                    min: 0,
                    isFloat: true,
                }
            }
        },
        {
            paranoid: true,
            timestamps: true,
            underscored: true,
        }
    );
    return PackSizesProducts;
};
