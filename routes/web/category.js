const express = require('express');
const router = express.Router();
const categoryController = require("../../controller/categoryController");
const { upload } = require("../../services/fileupload");

router.get("/", categoryController.getIndex);
router.get("/list", categoryController.getData);
router.get("/create", categoryController.create);
router.post("/store", upload.single('image'), categoryController.store);
router.post("/delete/:id", categoryController.deleteRecord);
router.get("/:id/edit", categoryController.edit);
router.post("/:id/update", upload.single('image'), categoryController.update);
router.post("/changestatus/:id", categoryController.changeStatus);

module.exports = router;