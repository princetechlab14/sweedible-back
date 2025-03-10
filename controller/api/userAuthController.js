const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../../models");
const { hashPassword, comparePassword, generateJWTToken } = require("../../services/passwordUtils");
const Joi = require("joi");
const User = db.UserModel;

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const registerSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(15).required(),
});

exports.auth = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if the user exists
        let user = await User.findOne({ where: { email } });

        if (user) {
            // If user exists, verify password and log in
            const isMatch = await comparePassword(password, user.password);
            if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

            const token = await generateJWTToken({ id: user.id, email: user.email, role: user.role });
            return res.json({ message: "Login successful", token, user });
        } else {
            // If user does not exist, register them
            const hashedPassword = await hashPassword(password);
            const newUser = await User.create({ name, email, password: hashedPassword });

            const token = await generateJWTToken({ id: newUser.id, email: newUser.email, role: newUser.role });
            return res.status(201).json({ 
                message: "User registered and logged in successfully!", 
                user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }, 
                token 
            });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user?.id, { attributes: { exclude: ["password"] } });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, country } = req.body;
        const userId = req.user.id;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.country = country || user.country;

        await user.save();

        res.json({ message: "Profile updated successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
