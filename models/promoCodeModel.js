module.exports = (sequelize, Sequelize, DataTypes) => {
    const PromoCode = sequelize.define(
        "promo_codes",
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            code: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },
            discount: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            type: {
                type: DataTypes.ENUM("Percantage", "Amount"),
                allowNull: false,
                defaultValue: "Percantage",
            },
            start_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            end_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM("Active", "Inactive"),
                defaultValue: "Active",
            }
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

    return PromoCode;
};
