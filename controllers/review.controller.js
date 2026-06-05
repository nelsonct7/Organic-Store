const reviewService = require("../services/review.service");

const submitReview = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login to review" });

    const { productId, rating, comment } = req.body;
    if (!productId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ status: false, message: "Rating must be between 1 and 5" });
    }

    const review = await reviewService.createReview(userId, productId, rating, comment || "");
    res.status(201).json({ status: true, review });
  } catch (err) {
    next(err);
  }
};

const getReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await reviewService.getProductReviews(productId);
    const summary = await reviewService.getProductRatingSummary(productId);
    res.json({ status: true, reviews, summary });
  } catch (err) {
    next(err);
  }
};

const listMyReviews = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const reviews = await reviewService.getUserReviews(userId);
    res.json({ status: true, reviews });
  } catch (err) {
    next(err);
  }
};

const updateMyReview = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ status: false, message: "Rating must be between 1 and 5" });
    }

    const review = await reviewService.updateReview(req.params.id, userId, rating, comment || "");
    res.json({ status: true, review });
  } catch (err) {
    if (err.message === "Review not found") return res.status(404).json({ status: false, message: "Review not found" });
    next(err);
  }
};

const deleteMyReview = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    await reviewService.deleteReview(req.params.id, userId);
    res.json({ status: true, message: "Review deleted" });
  } catch (err) {
    if (err.message === "Review not found") return res.status(404).json({ status: false, message: "Review not found" });
    next(err);
  }
};

module.exports = { submitReview, getReviews, listMyReviews, updateMyReview, deleteMyReview };
