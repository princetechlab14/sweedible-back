module.exports = (sequelize, Sequelize, DataTypes) => {
    const ProductReviews = sequelize.define(
        "product_reviews",
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
            email: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },
            rating: {
                type: DataTypes.INTEGER,
                defaultValue: 5,
            },
            note: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            view_status: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            paranoid: true,
            timestamps: true,
            underscored: true,
            deletedAt: "deleted_at",
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );
    return ProductReviews;
};
