module.exports = (sequelize, Sequelize, DataTypes) => {
    const Setting = sequelize.define(
        "settings",
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            key: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
            val: {
                type: DataTypes.STRING(500),
                allowNull: true,
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
    return Setting;
};
