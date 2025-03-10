const express = require("express");
const router = express.Router();
const cartController = require("../../controller/cartController");

router.get("/", cartController.getIndex);
router.get("/list", cartController.getData);
router.get("/:id/show", cartController.show);
module.exports = router;
