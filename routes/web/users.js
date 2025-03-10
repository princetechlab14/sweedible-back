const express = require("express");
const router = express.Router();
const userController = require("../../controller/userController");

router.get("/", userController.getIndex);
router.get("/list", userController.getData);
module.exports = router;
