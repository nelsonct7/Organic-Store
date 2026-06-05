const Review = require("../collections/review.collection");

const createReview = async (userId, productId, rating, comment) => {
  const existing = await Review.findOne({ userId, productId });
  if (existing) {
    existing.rating = rating;
    existing.comment = comment || "";
    return existing.save();
  }
  return Review.create({ userId, productId, rating, comment: comment || "" });
};

const getProductReviews = async (productId) => {
  return Review.find({ productId, isApproved: true })
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .lean();
};

const getUserReviewForProduct = async (userId, productId) => {
  if (!userId) return null;
  return Review.findOne({ userId, productId }).lean();
};

const getProductRatingSummary = async (productId) => {
  const reviews = await Review.find({ productId, isApproved: true }).select("rating").lean();
  if (!reviews.length) return { average: 0, count: 0 };
  const total = reviews.reduce((s, r) => s + r.rating, 0);
  return { average: Math.round((total / reviews.length) * 10) / 10, count: reviews.length };
};

const getAllProductsWithReviewStats = async (options = {}) => {
  const Product = require("../collections/product.collection");
  const { paginate } = require("../shared/utils/pagination.util");

  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(options.limit) || 10));
  const search = (options.search || "").trim();

  const filter = { isDeleted: false };
  if (search) filter.name = { $regex: search, $options: "i" };

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("category", "name")
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const productIds = products.map((p) => p._id);
  const stats = await Review.aggregate([
    { $match: { productId: { $in: productIds }, isApproved: true } },
    { $group: { _id: "$productId", average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const statsMap = {};
  stats.forEach((s) => { statsMap[s._id.toString()] = { average: Math.round(s.average * 10) / 10, count: s.count }; });

  const data = products.map((p) => ({
    ...p,
    reviewStats: statsMap[p._id.toString()] || { average: 0, count: 0 },
  }));

  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1, pages: Array.from({ length: totalPages }, (_, i) => i + 1) },
    search,
  };
};

const getProductReviewsPaginated = async (productId, options = {}) => {
  const { paginate } = require("../shared/utils/pagination.util");
  return paginate(Review, { productId }, options, [{ path: "userId", select: "name email mobile" }]);
};

const toggleReviewApproval = async (reviewId) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error("Review not found");
  review.isApproved = !review.isApproved;
  return review.save();
};

const getReviewById = async (reviewId) => {
  return Review.findById(reviewId).populate("userId", "name email").lean();
};

const getUserReviews = async (userId) => {
  return Review.find({ userId })
    .populate("productId", "name images price")
    .sort({ createdAt: -1 })
    .lean();
};

const updateReview = async (reviewId, userId, rating, comment) => {
  const review = await Review.findOne({ _id: reviewId, userId });
  if (!review) throw new Error("Review not found");
  review.rating = rating;
  review.comment = comment || "";
  return review.save();
};

const deleteReview = async (reviewId, userId) => {
  const review = await Review.findOneAndDelete({ _id: reviewId, userId });
  if (!review) throw new Error("Review not found");
  return review;
};

module.exports = { createReview, getProductReviews, getUserReviewForProduct, getProductRatingSummary, getAllProductsWithReviewStats, getProductReviewsPaginated, toggleReviewApproval, getReviewById, getUserReviews, updateReview, deleteReview };
