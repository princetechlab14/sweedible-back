module.exports = (sequelize, Sequelize, DataTypes) => {
    const Products = sequelize.define(
        "products",
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            offer_plan_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            title: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            type: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            slug: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            images: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            short_desc: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            availability: {
                type: DataTypes.ENUM("in_stock", "out_stock"),
                defaultValue: "in_stock",
            },
            most_selling: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            exclusive: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            featured: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            alt_text: {
                type: DataTypes.STRING(250),
                allowNull: true,
            },
            shorting: {
                type: DataTypes.INTEGER,
                defaultValue: 500,
            },
            status: {
                type: DataTypes.ENUM("Active", "InActive"),
                defaultValue: "Active",
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
    return Products;
};
