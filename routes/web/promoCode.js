const express = require('express');
const router = express.Router();
const promoCodeController = require("../../controller/promoCodeController");

router.get("/", promoCodeController.getIndex);
router.get("/create", promoCodeController.create);
router.post("/store", promoCodeController.store);
router.post("/delete/:id", promoCodeController.deleteRecord);
router.get("/:id/edit", promoCodeController.edit);
router.post("/:id/update", promoCodeController.update);
router.post("/changestatus/:id", promoCodeController.changeStatus);

module.exports = router;