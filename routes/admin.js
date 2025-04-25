const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { authCheck } = require("../middleware/auth.middleware");

// router.route("/register").get(authController.getRegister).post(authController.register);
router.route("/login").get(authController.getLogin).post(authController.login);
router.get("/logout", authController.logout);
router.get("/profile", authCheck, authController.profileGet);
router.post("/profile", authCheck, authController.profileUpdate);

/* GET home page. */
router.get("/", authCheck, async function (req, res, next) {
    try {
        res.render("dashboard", { title: "Dashboard", activePage: "dashboard", auth: req?.auth });
    } catch (error) {
        console.error("Error fetching counts:", error);
        res.status(500).send("Internal Server Error");
    }
});

// routes
router.use("/category", authCheck, require("./web/category"));
router.use("/sub-category", authCheck, require("./web/subCategory"));
router.use("/blogs", authCheck, require("./web/blog"));
router.use("/products", authCheck, require("./web/products"));
router.use("/offer-plans", authCheck, require("./web/offerPlans"));
router.use("/orders", authCheck, require("./web/order"));
router.use("/setting", authCheck, require("./web/setting"));
router.use("/promo-codes", authCheck, require("./web/promoCode"));
router.use("/users", authCheck, require("./web/users"));
router.use("/carts", authCheck, require("./web/carts"));
router.use("/offers", authCheck, require("./web/offers"));
router.use("/contact-us", authCheck, require("./web/contactUs"));
router.use("/doctors", authCheck, require("./web/doctors"));
module.exports = router;
