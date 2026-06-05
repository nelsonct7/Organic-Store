const Order = require("../collections/order.collection");
const OrderItem = require("../collections/order-item.collection");
const Product = require("../collections/product.collection");
const { NotFoundError, ValidationError } = require("../shared/utils/error.util");
const { restoreStock } = require("../services/inventory.service");
const mongoose = require("mongoose");

const listOrders = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/v1/auth/login");

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .populate("items.orderItemId")
      .lean();

    res.render("base/orders", {
      title: "My Orders",
      user: req.user,
      sessionUser: req.session.user,
      orders,
    });
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login first" });

    const order = await Order.findById(req.params.id)
      .populate("items.orderItemId")
      .lean();

    if (!order) throw new NotFoundError("Order not found");
    if (order.userId.toString() !== userId) {
      return res.status(403).json({ status: false, message: "Access denied" });
    }

    res.json({ status: true, order });
  } catch (err) {
    if (err.name === "NotFoundError") return res.status(404).json({ status: false, message: err.message });
    if (err.name === "CastError") return res.status(400).json({ status: false, message: "Invalid order ID" });
    next(err);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/v1/auth/login");

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("items.orderItemId")
        .lean(),
      Order.countDocuments({ userId }),
    ]);

    res.json({
      status: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login first" });

    const order = await Order.findById(req.params.id).populate("items.orderItemId").session(session);
    if (!order) throw new NotFoundError("Order not found");
    if (order.userId.toString() !== userId) {
      return res.status(403).json({ status: false, message: "Access denied" });
    }

    const cancellableStatuses = ["placed", "pending", "processing"];
    if (!cancellableStatuses.includes(order.status)) {
      throw new ValidationError(`Order cannot be cancelled in "${order.status}" status`);
    }

    const items = order.items.map((i) => i.orderItemId).filter(Boolean);
    const restoreItems = items.map((oi) => ({
      productId: oi.productId,
      selectedUnit: { measure: oi.selectedUnit?.measure || 0 },
      quantity: oi.quantity,
    }));

    await restoreStock(restoreItems, session);

    order.status = "cancelled";
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ status: true, message: "Order cancelled successfully" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    if (err.name === "NotFoundError") return res.status(404).json({ status: false, message: err.message });
    if (err.name === "ValidationError") return res.status(400).json({ status: false, message: err.message });
    next(err);
  }
};

module.exports = { listOrders, getOrderById, getMyOrders, cancelOrder };
