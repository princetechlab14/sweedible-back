const express = require("express");
const router = express.Router();
const productController = require("../../controller/productController");
const { upload } = require("../../services/fileupload");

router.get("/", productController.getIndex);
router.get("/list", productController.getData);
router.get("/create", productController.create);
router.post("/store", upload.array("images", 5), productController.store);
router.post("/delete/:id", productController.deleteRecord);
router.get("/:id/edit", productController.edit);
router.post("/:id/update", upload.array("images", 5), productController.update);
router.post("/changestatus/:id", productController.changeStatus);
router.get("/review/:id", productController.productReview);
router.post("/review-delete/:id", productController.deleteProductReviewRecord);
router.post("/offer-plans/:id", productController.productOfferPlansUpdate);

module.exports = router;
