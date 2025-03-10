module.exports = (sequelize, Sequelize, DataTypes) => {
    const SubCategoriesProducts = sequelize.define(
        "sub_categories_products",
        {
            product_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            sub_category_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            paranoid: false,
            timestamps: false,
            underscored: true,
        }
    );

    return SubCategoriesProducts;
};
