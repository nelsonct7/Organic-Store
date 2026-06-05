const feedbackService = require("../services/feedback.service");
const Product = require("../collections/product.collection");

const renderFeedbackForm = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/v1/auth/login");

    const products = await Product.find({ isDeleted: false, isActive: true }).select("name").sort({ name: 1 }).lean();
    const existing = await feedbackService.getUserFeedback(userId);

    res.render("base/feedback", {
      title: "Feedback - Organic Store",
      user: req.user,
      sessionUser: req.session.user,
      products,
      feedbacks: existing,
    });
  } catch (err) {
    next(err);
  }
};

const postFeedback = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const { type, productId, rating, subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ status: false, message: "Subject and message are required" });
    if (subject.length > 200) return res.status(400).json({ status: false, message: "Subject too long (max 200)" });
    if (message.length > 2000) return res.status(400).json({ status: false, message: "Message too long (max 2000)" });

    const feedback = await feedbackService.submitFeedback(userId, { type: type || "platform", productId, rating, subject, message });
    res.status(201).json({ status: true, feedback });
  } catch (err) {
    next(err);
  }
};

module.exports = { renderFeedbackForm, postFeedback };
