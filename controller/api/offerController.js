const { OfferModel } = require("../../models");
const { encrypt } = require("../../services/encryptResponse");

const AddEmailForOffer = async (req, res) => {
    let { email } = req.body;

    if (!email) {
        return res.status(400).json(encrypt({ success: false, message: "Email is required!" }));
    }

    email = email.trim().toLowerCase(); // Normalize email

    try {
        // Check if email already exists
        const [existingEmail] = await OfferModel.findAll({ where: { email } });

        if (existingEmail) {
            return res.status(400).json(encrypt({ success: false, message: "Email already exists!" }));
        }

        // Insert email into database
        await OfferModel.create({ email });

        return res.status(201).json(encrypt({ success: true, message: "Email added successfully!" }));

    } catch (error) {
        console.error("Error submitting:", error);

        // Check for MySQL duplicate entry error (code 1062)
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(400).json(encrypt({ success: false, message: "Email already exists!" }));
        }

        return res.status(500).json(encrypt({ success: false, message: "Something went wrong!" }));
    }
};

module.exports = { AddEmailForOffer };
