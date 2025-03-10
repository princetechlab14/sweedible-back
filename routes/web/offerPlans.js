const express = require('express');
const router = express.Router();
const offerPlansController = require("../../controller/offerPlansController");

router.get("/", offerPlansController.getIndex);
router.get("/list", offerPlansController.getData);
router.get("/create", offerPlansController.create);
router.post("/store", offerPlansController.store);
router.post("/delete/:id", offerPlansController.deleteRecord);
router.get("/:id/edit", offerPlansController.edit);
router.post("/:id/update", offerPlansController.update);
router.post("/changestatus/:id", offerPlansController.changeStatus);
module.exports = router;