const Message = require("../collections/message.collection");
const { paginate } = require("../shared/utils/pagination.util");

const createConversation = async (userId, subject, content) => {
  return Message.create({
    userId,
    subject,
    messages: [{ sender: "user", content }],
  });
};

const replyToConversation = async (conversationId, sender, content) => {
  const update = {
    $push: { messages: { sender, content, createdAt: new Date() } },
  };
  if (sender === "admin") update.$set = { status: "replied" };
  return Message.findByIdAndUpdate(conversationId, update, { new: true }).lean();
};

const getUserConversations = async (userId) => {
  return Message.find({ userId })
    .select("subject status messages createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
};

const getUserConversation = async (conversationId, userId) => {
  return Message.findOne({ _id: conversationId, userId }).lean();
};

const getConversationById = async (conversationId) => {
  return Message.findById(conversationId)
    .populate("userId", "name email mobile")
    .lean();
};

const getConversationsPage = async (options = {}) => {
  const query = {};
  const search = (options.search || "").trim();
  if (search) {
    query.$or = [
      { subject: { $regex: search, $options: "i" } },
    ];
  }

  const result = await paginate(Message, query, options, [
    { path: "userId", select: "name email mobile" },
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

const closeConversation = async (conversationId) => {
  return Message.findByIdAndUpdate(conversationId, { status: "closed" }, { new: true }).lean();
};

const getUnreadCount = async (userId) => {
  return Message.countDocuments({
    userId,
    status: "replied",
    "messages.sender": "admin",
  });
};

module.exports = {
  createConversation,
  replyToConversation,
  getUserConversations,
  getUserConversation,
  getConversationById,
  getConversationsPage,
  closeConversation,
  getUnreadCount,
};
