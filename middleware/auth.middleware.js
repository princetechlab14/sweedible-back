const { verifyToken } = require("../services/passwordUtils");
const jwt = require("jsonwebtoken");

const authCheck = async (req, res, next) => {
    const token = req?.cookies?._gmtls;
    if (!token) return res.redirect("/admin/login");
    const authUser = verifyToken(token);
    try {
        if (!authUser) return res.redirect("/admin/login");
        req.authUser = authUser;
        await authUser.then((authArray) => { req.auth = authArray; });
        next();
    } catch (error) {
        return res.redirect("/admin/login");
    }
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ status: false, message: "Please provide a user token" });
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ status: false, message: "Invalid token format. Use 'Bearer <token>'" });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === "TokenExpiredError") return res.status(401).json({ status: false, message: "Login Again" });
            return res.status(401).json({ status: false, message: "Unauthorized" });
        }
        req.user = user;
        next();
    });
};

module.exports = { authCheck, authenticateToken };