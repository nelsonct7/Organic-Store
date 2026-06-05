const express = require("express");
const { submitReview, getReviews, listMyReviews, updateMyReview, deleteMyReview } = require("../controllers/review.controller");

const router = express.Router();

router.post("/api/review", submitReview);
router.get("/api/reviews/:productId", getReviews);
router.get("/api/my-reviews", listMyReviews);
router.put("/api/my-reviews/:id", updateMyReview);
router.delete("/api/my-reviews/:id", deleteMyReview);

module.exports = router;
