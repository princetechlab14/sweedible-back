const express = require("express");
const router = express.Router();
const contactUsController = require("../../controller/contactUsController");

router.get("/", contactUsController.getIndex);
router.get("/list", contactUsController.getData);
router.post("/delete/:id", contactUsController.deleteRecord);
router.get("/:id/view", contactUsController.show);

module.exports = router;
