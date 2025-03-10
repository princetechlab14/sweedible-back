const express = require('express');
const router = express.Router();
const homeController = require("../controller/homeController");

/* GET home page. */
router.get('/', homeController.Home);

module.exports = router;
