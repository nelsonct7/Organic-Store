const messageService = require("../services/message.service");

const renderUserMessages = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/v1/auth/login");

    const conversations = await messageService.getUserConversations(userId);
    res.render("base/messages", {
      title: "My Messages - Organic Store",
      user: req.user,
      sessionUser: req.session.user,
      conversations,
    });
  } catch (err) {
    next(err);
  }
};

const postUserMessage = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ status: false, message: "Subject and message are required" });
    if (subject.length > 200) return res.status(400).json({ status: false, message: "Subject too long" });
    if (message.length > 2000) return res.status(400).json({ status: false, message: "Message too long" });

    const conversation = await messageService.createConversation(userId, subject, message);
    res.status(201).json({ status: true, conversation });
  } catch (err) {
    next(err);
  }
};

const postUserReply = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const { content } = req.body;
    if (!content || content.length > 2000) return res.status(400).json({ status: false, message: "Invalid message" });

    const conversation = await messageService.getUserConversation(req.params.id, userId);
    if (!conversation) return res.status(404).json({ status: false, message: "Conversation not found" });

    await messageService.replyToConversation(req.params.id, "user", content);
    res.json({ status: true });
  } catch (err) {
    next(err);
  }
};

const getConversationData = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const conversation = await messageService.getUserConversation(req.params.id, userId);
    if (!conversation) return res.status(404).json({ status: false, message: "Conversation not found" });

    res.json({ status: true, conversation });
  } catch (err) {
    next(err);
  }
};

const renderAdminMessages = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await messageService.getConversationsPage({ page, limit, search });
    res.render("admin/view-message", {
      title: "Messages - Organic Store",
      admin: true,
      adminData: req.session.admin,
      data: result.data,
      pagination: result.pagination,
      search: result.search,
    });
  } catch (error) {
    next(error);
  }
};

const postAdminReply = async (req, res, next) => {
  try {
    const { content, status } = req.body;
    if (!content || content.length > 2000) return res.status(400).json({ status: false, message: "Invalid reply" });

    const conversation = await messageService.getConversationById(req.params.id);
    if (!conversation) return res.status(404).json({ status: false, message: "Conversation not found" });

    await messageService.replyToConversation(req.params.id, "admin", content);

    if (status === "closed") {
      await messageService.closeConversation(req.params.id);
    }

    res.json({ status: true });
  } catch (error) {
    next(error);
  }
};

const deleteConversation = async (req, res, next) => {
  try {
    const Message = require("../collections/message.collection");
    const conv = await Message.findByIdAndDelete(req.params.id);
    if (!conv) return res.status(404).json({ status: false, message: "Conversation not found" });
    res.json({ status: true, message: "Conversation deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  renderUserMessages,
  postUserMessage,
  postUserReply,
  getConversationData,
  renderAdminMessages,
  postAdminReply,
  deleteConversation,
};
