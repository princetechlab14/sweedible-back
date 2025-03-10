const express = require('express');
const router = express.Router();
const subCategoryController = require("../../controller/subCategoryController");

router.get("/", subCategoryController.getIndex);
router.get("/list", subCategoryController.getData);
router.get("/create", subCategoryController.create);
router.post("/store", subCategoryController.store);
router.post("/delete/:id", subCategoryController.deleteRecord);
router.get("/:id/edit", subCategoryController.edit);
router.post("/:id/update", subCategoryController.update);
router.post("/changestatus/:id", subCategoryController.changeStatus);

module.exports = router;