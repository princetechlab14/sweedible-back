const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || "localhost",
        dialect: 'mysql',
        pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            charset: "utf8mb4",
            collate: "utf8mb4_unicode_ci",
        }
    }
);

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.AdminModel = require('./adminModel')(sequelize, Sequelize, DataTypes);
db.CategoryModel = require('./categoryModel')(sequelize, Sequelize, DataTypes);
db.SubCategoryModel = require('./subCategoryModel')(sequelize, Sequelize, DataTypes);
db.BlogModel = require('./blogModel')(sequelize, Sequelize, DataTypes);
db.ProductModel = require('./productModel')(sequelize, Sequelize, DataTypes);
db.SubCategoryProductModel = require('./subCategoryProductModel')(sequelize, Sequelize, DataTypes);
db.PackSizeProductModel = require('./packSizeProductModel')(sequelize, Sequelize, DataTypes);
db.CartModel = require('./cartModel')(sequelize, Sequelize, DataTypes);
db.UserModel = require('./userModel')(sequelize, Sequelize, DataTypes);
db.OfferPlansModel = require('./offerPlansModel')(sequelize, Sequelize, DataTypes);
db.ProductReviewModel = require('./productReviewModel')(sequelize, Sequelize, DataTypes);
db.SettingModel = require('./settingModel')(sequelize, Sequelize, DataTypes);
db.PromoCodeModel = require('./promoCodeModel')(sequelize, Sequelize, DataTypes);
db.OrderModel = require('./orderModel')(sequelize, Sequelize, DataTypes);
db.OrderItemsModel = require('./orderItemsModel')(sequelize, Sequelize, DataTypes);
db.ContactUsModel = require('./contactModel')(sequelize, Sequelize, DataTypes);
db.OfferModel = require('./offerModel')(sequelize, Sequelize, DataTypes);
db.CartItemModel = require('./cartItemModel')(sequelize, Sequelize, DataTypes);
db.DoctorsModel = require('./doctorsModel')(sequelize, Sequelize, DataTypes);

// Define Relationships
// 1. Category and SubCategory (One-to-Many)
db.CategoryModel.hasMany(db.SubCategoryModel, { foreignKey: "category_id", as: "subCategories" });
db.SubCategoryModel.belongsTo(db.CategoryModel, { foreignKey: "category_id", as: "mainCategories" });

// 2. Define Many-to-Many Relationship
db.ProductModel.belongsToMany(db.SubCategoryModel, { through: db.SubCategoryProductModel, foreignKey: "product_id" });
db.SubCategoryModel.belongsToMany(db.ProductModel, { through: db.SubCategoryProductModel, foreignKey: "sub_category_id" });

// 3. product and product pack size model 
db.ProductModel.hasMany(db.PackSizeProductModel, { foreignKey: "product_id", as: "packsizes" });
db.PackSizeProductModel.belongsTo(db.ProductModel, { foreignKey: "product_id", as: "mainProduct" });

// Cart belongs
db.CartItemModel.belongsTo(db.ProductModel, { foreignKey: "product_id", as: "product" });
db.CartModel.belongsTo(db.UserModel, { foreignKey: "user_id", as: "user" });
db.ProductModel.hasMany(db.CartItemModel, { foreignKey: "product_id", as: "cartItems" });
db.UserModel.hasMany(db.CartModel, { foreignKey: "user_id", as: "carts" });

// Orders and Users (One-to-Many)
db.UserModel.hasMany(db.OrderModel, { foreignKey: "user_id", as: "orders" });
db.OrderModel.belongsTo(db.UserModel, { foreignKey: "user_id", as: "users" });

// Orders and Order Items (One-to-Many)
db.OrderModel.hasMany(db.OrderItemsModel, { foreignKey: "order_id", as: "orderItems" });
db.OrderItemsModel.belongsTo(db.OrderModel, { foreignKey: "order_id", as: "order" });

// Order Items and Products (Many-to-One)
db.OrderItemsModel.belongsTo(db.ProductModel, { foreignKey: "product_id", as: "productDetail" });
db.ProductModel.hasMany(db.OrderItemsModel, { foreignKey: "product_id", as: "orderItems" });

// OfferPlans and SubCategory (One-to-Many)
db.ProductModel.belongsTo(db.OfferPlansModel, { foreignKey: "offer_plan_id", as: "offerplan" });

db.ProductModel.hasMany(db.ProductReviewModel, { foreignKey: "product_id", as: "productReviews" });
db.CartItemModel.belongsTo(db.PackSizeProductModel, { foreignKey: "packsize_id", as: "packsize" });
db.CartModel.belongsTo(db.PromoCodeModel, { foreignKey: "promocode_id", as: "promocode" });
db.OrderModel.belongsTo(db.PromoCodeModel, { foreignKey: "promocode_id", as: "orderPromoCode" });
db.OrderItemsModel.belongsTo(db.PackSizeProductModel, { foreignKey: "packsize_id", as: "packSizeDetail" });
db.OrderItemsModel.belongsTo(db.ProductModel, { foreignKey: "product_id", as: "products" });
db.CartItemModel.belongsTo(db.CartModel, { foreignKey: "cart_id", as: "mainCart" });
db.CartModel.hasMany(db.CartItemModel, { foreignKey: "cart_id", as: "cartItems" });

module.exports = db;