const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Function to hash a password
exports.hashPassword = async (password) => {
    const saltRounds = 8;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
};

// Function to compare passwords
exports.comparePassword = async (plainPassword, hashedPassword) => {
    const isPasswordValid = await bcrypt.compare(plainPassword, hashedPassword);
    return isPasswordValid;
};

// Function to generate JWT token
exports.generateJWTToken = async (payload) => {
    const options = {
        expiresIn: "24h",
    };
    return jwt.sign(payload, process.env.JWT_SECRET || "medicine-back", options);
};

exports.generateHashPassword = async (myPassword, salt = 8) => {
    return await bcrypt.hashSync(myPassword, salt);
};

exports.passwordCompare = async (myPassword, hash, additional = undefined) => {
    return await bcrypt.compareSync(myPassword, hash, additional || undefined);
};

exports.generateToken = async (userDetail) => {
    let token = jwt.sign({ id: userDetail.id, email: userDetail.email, name: userDetail.name, profile: userDetail.profile, }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN || "1D" });
    return token;
};

exports.verifyToken = async (token) => {
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
};
