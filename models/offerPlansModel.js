module.exports = (sequelize, Sequelize, DataTypes) => {
    const OfferPlan = sequelize.define(
        "offer_plans",
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            discount: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            type: {
                type: DataTypes.ENUM("Percantage", "Amount"),
                defaultValue: "Percantage",
            },
            shorting: {
                type: DataTypes.INTEGER,
                defaultValue: 500,
            },
            status: {
                type: DataTypes.ENUM("Active", "InActive"),
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
    return OfferPlan;
};
