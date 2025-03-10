const express = require("express");
const router = express.Router();
const orderController = require("../../controller/orderController");

router.get("/", orderController.getIndex);
router.get("/list", orderController.getData);
router.post("/update-status", orderController.updateStatus);
router.post("/delete/:id", orderController.deleteRecord);
router.get("/item/:id", orderController.orderItems);
module.exports = router;
