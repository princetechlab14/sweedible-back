const express = require("express");
const router = express.Router();
const settingController = require("../../controller/settingController");

router.get("/", settingController.getIndex);
router.get("/create", settingController.create);
router.post("/store", settingController.store);
router.post("/delete/:id", settingController.deleteRecord);
router.get("/:id/edit", settingController.edit);
router.post("/:id/update", settingController.update);

module.exports = router;