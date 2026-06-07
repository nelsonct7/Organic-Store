const Return = require("../collections/return.collection");
const Order = require("../collections/order.collection");
const walletService = require("./wallet.service");
const { ValidationError, NotFoundError } = require("../shared/utils/error.util");

const canRequestReturn = (order) => {
  if (order.status !== "delivered") {
    return { allowed: false, reason: "Only delivered orders can be returned" };
  }

  const deliveredAt = order.updatedAt || order.createdAt;
  const now = new Date();
  const daysSinceDelivery = (now - new Date(deliveredAt)) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > 5) {
    return { allowed: false, reason: "Return window of 5 days has expired" };
  }

  return { allowed: true };
};

const requestReturn = async (userId, orderId, reason, itemIndices) => {
  const order = await Order.findById(orderId)
    .populate("items.orderItemId")
    .lean();

  if (!order) throw new NotFoundError("Order not found");
  if (order.userId.toString() !== userId) {
    throw new ValidationError("This order does not belong to you");
  }

  const check = canRequestReturn(order);
  if (!check.allowed) throw new ValidationError(check.reason);

  const existingReturn = await Return.findOne({ orderId, status: { $in: ["requested", "approved"] } }).lean();
  if (existingReturn) {
    throw new ValidationError("A return request already exists for this order");
  }

  let selectedItems;
  if (itemIndices && itemIndices.length) {
    selectedItems = order.items
      .filter((_, i) => itemIndices.includes(i))
      .map((ref) => ref.orderItemId)
      .filter(Boolean);
  } else {
    selectedItems = order.items.map((ref) => ref.orderItemId).filter(Boolean);
  }

  if (!selectedItems.length) throw new ValidationError("No items to return");

  const items = selectedItems.map((oi) => ({
    productId: oi.productId,
    productName: oi.productName,
    quantity: oi.quantity,
    unitPrice: oi.finalUnitPrice,
  }));

  const refundAmount = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const returnDoc = await Return.create({
    orderId,
    userId,
    items,
    reason,
    refundAmount,
    requestedAt: new Date(),
  });

  return returnDoc;
};

const approveReturn = async (returnId, adminNote = "") => {
  const returnDoc = await Return.findById(returnId);
  if (!returnDoc) throw new NotFoundError("Return request not found");
  if (returnDoc.status !== "requested") {
    throw new ValidationError("Return request is not in requested status");
  }

  returnDoc.status = "approved";
  returnDoc.adminNote = adminNote;
  returnDoc.approvedAt = new Date();
  await returnDoc.save();

  return returnDoc;
};

const rejectReturn = async (returnId, adminNote = "") => {
  const returnDoc = await Return.findById(returnId);
  if (!returnDoc) throw new NotFoundError("Return request not found");
  if (returnDoc.status !== "requested") {
    throw new ValidationError("Return request is not in requested status");
  }

  returnDoc.status = "rejected";
  returnDoc.adminNote = adminNote;
  await returnDoc.save();

  return returnDoc;
};

const refundReturn = async (returnId) => {
  const returnDoc = await Return.findById(returnId);
  if (!returnDoc) throw new NotFoundError("Return request not found");
  if (returnDoc.status !== "approved") {
    throw new ValidationError("Return must be approved before refund");
  }

  await walletService.credit(
    returnDoc.userId,
    returnDoc.refundAmount,
    `Refund for return #${returnDoc._id}`,
    returnDoc.orderId.toString(),
  );

  returnDoc.status = "refunded";
  returnDoc.refundedAt = new Date();
  await returnDoc.save();

  return returnDoc;
};

const getReturnsByUser = async (userId) => {
  return Return.find({ userId })
    .populate("orderId")
    .sort({ createdAt: -1 })
    .lean();
};

const getReturnById = async (returnId) => {
  const returnDoc = await Return.findById(returnId)
    .populate("orderId")
    .populate("userId", "name email mobile")
    .lean();
  if (!returnDoc) throw new NotFoundError("Return request not found");
  return returnDoc;
};

const getReturnsPage = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  const search = query.search || "";

  const filter = {};
  if (search) {
    filter.$or = [
      { reason: { $regex: search, $options: "i" } },
    ];
  }
  if (query.status) filter.status = query.status;

  const [returns, total] = await Promise.all([
    Return.find(filter)
      .populate("orderId")
      .populate("userId", "name email mobile")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Return.countDocuments(filter),
  ]);

  return {
    data: returns,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  canRequestReturn,
  requestReturn,
  approveReturn,
  rejectReturn,
  refundReturn,
  getReturnsByUser,
  getReturnById,
  getReturnsPage,
};
