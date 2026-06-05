const Feedback = require("../collections/feedback.collection");
const { paginate } = require("../shared/utils/pagination.util");

const submitFeedback = async (userId, data) => {
  return Feedback.create({
    userId,
    type: data.type || "platform",
    productId: data.productId || null,
    rating: data.rating || null,
    subject: data.subject,
    message: data.message,
  });
};

const getUserFeedback = async (userId) => {
  return Feedback.find({ userId }).populate("productId", "name").sort({ createdAt: -1 }).lean();
};

const getFeedbackPage = async (options = {}) => {
  const query = {};
  const search = (options.search || "").trim();
  if (search) {
    query.$or = [
      { subject: { $regex: search, $options: "i" } },
      { message: { $regex: search, $options: "i" } },
    ];
  }

  const result = await paginate(Feedback, query, options, [
    { path: "userId", select: "name email mobile" },
    { path: "productId", select: "name" },
  ]);

  return {
    data: result.data,
    pagination: {
      ...result.pagination,
      start: (result.pagination.page - 1) * result.pagination.limit + 1,
      end: Math.min(result.pagination.page * result.pagination.limit, result.pagination.total),
    },
    search: result.search,
  };
};

const updateFeedbackStatus = async (feedbackId, status, adminNote) => {
  const update = { status };
  if (adminNote !== undefined) update.adminNote = adminNote;
  return Feedback.findByIdAndUpdate(feedbackId, update, { new: true }).lean();
};

const deleteFeedback = async (feedbackId) => {
  return Feedback.findByIdAndDelete(feedbackId);
};

module.exports = { submitFeedback, getUserFeedback, getFeedbackPage, updateFeedbackStatus, deleteFeedback };
