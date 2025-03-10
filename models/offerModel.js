module.exports = (sequelize, Sequelize, DataTypes) => {
    const Offer = sequelize.define("offer_emails", {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    }); 

    return Offer;
};
