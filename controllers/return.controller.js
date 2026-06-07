const returnService = require("../services/return.service");

const renderReturnPage = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/v1/auth/login");

    const { orderId } = req.params;
    const Order = require("../collections/order.collection");
    const order = await Order.findById(orderId)
      .populate("items.orderItemId")
      .lean();

    if (!order) return res.redirect("/orders");
    if (order.userId.toString() !== userId) return res.redirect("/orders");

    const check = returnService.canRequestReturn(order);
    if (!check.allowed) {
      req.flash("error", check.reason);
      return res.redirect("/orders");
    }

    res.render("base/return", {
      title: "Return Items - Organic Store",
      user: req.user,
      sessionUser: req.session.user,
      order,
    });
  } catch (err) {
    next(err);
  }
};

const submitReturnRequest = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login first" });

    const { orderId } = req.params;
    const { reason, itemIndices } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ status: false, message: "Please provide a reason for return" });
    }

    await returnService.requestReturn(userId, orderId, reason, itemIndices);

    res.json({ status: true, message: "Return request submitted successfully" });
  } catch (err) {
    if (err.name === "NotFoundError") return res.status(404).json({ status: false, message: err.message });
    if (err.name === "ValidationError") return res.status(400).json({ status: false, message: err.message });
    next(err);
  }
};

const adminRenderReturns = async (req, res, next) => {
  try {
    const result = await returnService.getReturnsPage(req.query);

    res.render("admin/view-returns", {
      title: "Return Requests - Organic Store",
      admin: true,
      adminData: req.session.admin,
      returns: result.data,
      pagination: result.pagination,
      search: req.query.search || "",
      statusFilter: req.query.status || "",
    });
  } catch (err) {
    next(err);
  }
};

const adminApproveReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    await returnService.approveReturn(id, adminNote);

    res.json({ status: true, message: "Return approved. Ready for refund." });
  } catch (err) {
    if (err.name === "NotFoundError") return res.status(404).json({ status: false, message: err.message });
    if (err.name === "ValidationError") return res.status(400).json({ status: false, message: err.message });
    next(err);
  }
};

const adminRejectReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    await returnService.rejectReturn(id, adminNote);

    res.json({ status: true, message: "Return request rejected" });
  } catch (err) {
    if (err.name === "NotFoundError") return res.status(404).json({ status: false, message: err.message });
    if (err.name === "ValidationError") return res.status(400).json({ status: false, message: err.message });
    next(err);
  }
};

const adminRefundReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    await returnService.refundReturn(id);

    res.json({ status: true, message: "Refund processed via wallet" });
  } catch (err) {
    if (err.name === "NotFoundError") return res.status(404).json({ status: false, message: err.message });
    if (err.name === "ValidationError") return res.status(400).json({ status: false, message: err.message });
    next(err);
  }
};

module.exports = {
  renderReturnPage,
  submitReturnRequest,
  adminRenderReturns,
  adminApproveReturn,
  adminRejectReturn,
  adminRefundReturn,
};
