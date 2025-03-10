const { ContactUsModel } = require("../../models");

const AddContactUs = async (req, res) => {
    const { first_name, last_name, email, phone, message } = req.body;

    let obj = { first_name, last_name, email, phone, message };
    try {
        const data = await ContactUsModel.create(obj);
        if (data) {
            return res.status(201).json({ success: true, message: "Contact form submitted successfully!" });
        } else {
            return res.status(500).json({ success: false, message: "Server error, please try again." });
        }
    } catch (error) {
        console.error("Error submitting contact form:", error);
        return res.status(500).json({ success: false, message: "Something went wrong!" });
    }
};

module.exports = { AddContactUs };
