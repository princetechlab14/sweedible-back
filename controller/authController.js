const { AdminModel } = require('../models');
const { generateHashPassword, passwordCompare, generateToken } = require('../services/passwordUtils');

const getRegister = (req, res) => {
    res.render("register", { title: "Register", error: "" });
};

const register = async (req, res) => {
    const { name, email, password, repeatPassword } = req?.body;
    if (password !== repeatPassword) {
        res.render("register", { title: "Register", error: "Password not mess and min 8 later length", oldVal: { name, email } });
        return;
    }
    const hashPassword = await generateHashPassword(password, 8);
    let obj = {
        name, email, password: hashPassword
    };
    const userDetail = await AdminModel.findOne({ where: { email: email } });
    if (!userDetail) {
        try {
            const data = await AdminModel.create(obj);
            if (data) {
                res.redirect("/admin/login");
            } else {
                res.render("register", { title: "Register", error: "Server error.", oldVal: { name, email } });
            }
        } catch (error) {
            res.render("register", { title: "Register", error: "Email all ready exists.", oldVal: { name, email } });
        }
    } else {
        res.render("register", { title: "Register", error: "Email all ready exists.", oldVal: { name, email } });
    }
};

const getLogin = (req, res) => {
    res.render("login", { title: "Login", error: "" });
};

const login = async (req, res) => {
    const { email, password: pwd } = req?.body;
    let query = {
        where: { email: email, status: "Active" },
        attributes: ["id", "name", "email", "password", "status"],
    };

    const userDetail = await AdminModel.findOne(query);
    if (userDetail) {
        let passwordValidate = await passwordCompare(pwd, userDetail.password);
        const token = await generateToken(userDetail);
        if (passwordValidate) {
            res.cookie("_gmtls", token);
            res.redirect("/admin/");
        } else {
            res.render("login", { title: "Login", error: "Credential not valid." });
        }
    } else {
        res.render("login", { title: "Login", error: "Credential not valid." });
    }
};

const logout = (req, res) => {
    res.clearCookie("_gmtls");
    res.redirect("/");
};

const profileGet = async (req, res) => {
    const authId = req?.auth?.id;
    try {
        let query = {
            where: { id: authId, status: "Active" },
            attributes: ["id", "name", "email", "password"],
        };
        const admin = await AdminModel.findOne(query);
        if (admin) {
            res.render("profile", { title: "Update Profile", admin, error: "" });
        } else {
            res.redirect("/admin");
        }
    } catch (error) {
        console.error("Error fetching admin profile details:", error);
        res.redirect('/admin');
    }
};

const profileUpdate = async (req, res) => {
    const { id } = req.auth;
    const { name, password } = req.body;
    try {
        const admin = await AdminModel.findOne({ where: { id } });
        if (admin) {
            admin.name = name;
            if (password) {
                admin.password = await generateHashPassword(password, 10);
            }
            await admin.save();
            res.redirect("/admin/profile");
        } else {
            res.render("profile", {
                title: "Update Profile Page",
                admin: null,
                error: "Admin not found",
            });
        }
    } catch (error) {
        console.error("Error updating admin details:", error);
        res.render("profile", {
            title: "Update Profile Page",
            admin: null,
            error: "Internal server error",
        });
    }
};

module.exports = { getLogin, getRegister, register, login, logout, profileGet, profileUpdate };