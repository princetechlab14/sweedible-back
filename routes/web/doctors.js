const express = require('express');
const router = express.Router();
const doctorsController = require("../../controller/doctorsController");
const { upload } = require("../../services/fileupload");

router.get("/", doctorsController.getIndex);
router.get("/list", doctorsController.getData);
router.get("/create", doctorsController.create);
router.post("/store", upload.single('image'), doctorsController.store);
router.post("/delete/:id", doctorsController.deleteRecord);
router.get("/:id/edit", doctorsController.edit);
router.post("/:id/update", upload.single('image'), doctorsController.update);
router.post("/changestatus/:id", doctorsController.changeStatus);
router.post("/live-status/:id", doctorsController.changeLiveStatus);
module.exports = router;