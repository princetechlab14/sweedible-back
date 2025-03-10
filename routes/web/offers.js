const express = require("express");
const router = express.Router();
const offersController = require("../../controller/offersController");

router.get("/", offersController.getIndex);
router.get("/list", offersController.getData);
module.exports = router;
