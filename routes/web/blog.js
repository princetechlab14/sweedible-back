const express = require("express");
const router = express.Router();
const blogController = require("../../controller/blogController");
const { upload } = require("../../services/fileupload");

router.get("/", blogController.getIndex);
router.get("/list", blogController.getData);
router.get("/create", blogController.create);
router.post("/store", upload.array("images", 5), blogController.store);
router.post("/delete/:id", blogController.deleteRecord);
router.get("/:id/edit", blogController.edit);
router.post("/:id/update", upload.array("images", 5), blogController.update);
router.post("/changestatus/:id", blogController.changeStatus);

module.exports = router;
