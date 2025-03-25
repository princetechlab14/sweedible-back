module.exports = (sequelize, Sequelize, DataTypes) => {
    const Doctors = sequelize.define(
        "doctors",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            degree: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            room_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            image: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            shorting: {
                type: DataTypes.INTEGER,
                defaultValue: 50,
            },
            live_status: {
                type: DataTypes.ENUM("Online", "Offline", "Busy"),
                defaultValue: "Offline",
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

    return Doctors;
};
