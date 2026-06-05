const mongoose = require("mongoose");
const Cart = require("../collections/cart.collection");
const CartItem = require("../collections/cart-item.collection");
const Product = require("../collections/product.collection");
const Order = require("../collections/order.collection");
const OrderItem = require("../collections/order-item.collection");
const { NotFoundError, ValidationError } = require("../shared/utils/error.util");
const { resolveBestOffer, applyOffer, calculateCartTotals, applyCoupon } = require("./pricing.service");

const CouponUsage = mongoose.models.CheckoutCouponUsage || mongoose.model("CheckoutCouponUsage",
  new mongoose.Schema({
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "CheckoutCoupon", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    usedAt: { type: Date, default: Date.now },
  }, { timestamps: true }),
  "checkout_coupon_usage"
);

const CouponModel = () => mongoose.models.CheckoutCoupon;

const calculateItemPrice = async (cartItem, product) => {
  const unitPrice = cartItem.selectedUnit?.price || product.price || 0;
  const quantity = cartItem.quantity || 1;
  const offer = await resolveBestOffer(product._id, product.category);
  const { discount, finalPrice } = applyOffer(unitPrice, offer);
  return { unitPrice, offerDiscount: discount, finalUnitPrice: finalPrice, lineTotal: unitPrice * quantity, offer };
};

const validateCheckout = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart || !cart.items.length) throw new ValidationError("Cart is empty");

  const itemIds = cart.items.map((i) => i.cartItemId);
  const cartItems = await CartItem.find({ _id: { $in: itemIds } }).lean();
  if (!cartItems.length) throw new ValidationError("Cart is empty");

  const errors = [];
  const validItems = [];

  for (const ci of cartItems) {
    const product = await Product.findById(ci.productId).lean();
    if (!product) { errors.push({ productId: ci.productId.toString(), message: "Product not found" }); continue; }
    if (product.isDeleted || !product.isActive) { errors.push({ productId: ci.productId.toString(), message: `${product.name} is no longer available` }); continue; }

    const unitLabel = ci.selectedUnit?.label;
    const validUnit = unitLabel ? product.availableUnits?.find((u) => u.label === unitLabel && u.measure === ci.selectedUnit?.measure) : null;
    if (unitLabel && !validUnit) { errors.push({ productId: ci.productId.toString(), message: `Unit "${unitLabel}" no longer available for ${product.name}` }); continue; }

    const unitPrice = validUnit ? validUnit.price : product.price;
    const quantity = ci.quantity || 1;
    const required = (ci.selectedUnit?.measure || 0) * quantity;

    if (required > 0 && product.stockIn < required) {
      errors.push({ productId: ci.productId.toString(), message: `Insufficient stock for ${product.name}. Need ${required}, have ${product.stockIn}.` });
      continue;
    }

    validItems.push({ ci, product, unitPrice, quantity, required });
  }

  return { cart, validItems, errors };
};

const clearCart = async (cart, session) => {
  const itemIds = cart.items.map((i) => i.cartItemId);
  await CartItem.deleteMany({ _id: { $in: itemIds } }, { session });
  cart.items = [];
  cart.totalAmount = 0;
  cart.totalDiscount = 0;
  cart.finalAmount = 0;
  cart.appliedCoupon = { couponId: null, code: null, discount: 0 };
  await cart.save({ session });
};

const createCODOrder = async (userId, addressId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { cart, validItems } = await validateCheckout(userId);
    if (!validItems.length) throw new ValidationError("No valid items to checkout");

    const pricedItems = [];
    for (const item of validItems) {
      const offer = await resolveBestOffer(item.product._id, item.product.category);
      const { discount, finalPrice } = applyOffer(item.unitPrice, offer);
      pricedItems.push({ ...item, offerDiscount: discount, finalUnitPrice: finalPrice, lineTotal: item.unitPrice * item.quantity, finalLineTotal: finalPrice * item.quantity, offer });
    }

    const afterOfferAmount = pricedItems.reduce((s, i) => s + i.lineTotal, 0) - pricedItems.reduce((s, i) => s + i.offerDiscount * i.quantity, 0);

    let couponDiscount = 0;
    let appliedCouponData = { couponId: null, code: null, discount: 0 };
    if (cart.appliedCoupon?.code) {
      const result = await applyCoupon(cart.appliedCoupon.code, userId, afterOfferAmount);
      if (result.error) throw new ValidationError(result.error);
      couponDiscount = result.discount;
      appliedCouponData = { couponId: result.coupon._id, code: result.coupon.code, discount: result.discount };
    }

    const totals = calculateCartTotals(pricedItems, couponDiscount);

    for (const item of pricedItems) {
      if (item.required > 0) {
        const updated = await Product.findByIdAndUpdate(item.product._id, { $inc: { stockIn: -item.required } }, { session, new: true });
        if (!updated || updated.stockIn < 0) throw new Error(`Stock reservation failed for ${item.product.name}`);
      }
    }

    const orderItems = [];
    for (const item of pricedItems) {
      const [oi] = await OrderItem.create([{
        productId: item.product._id,
        orderId: null,
        productName: item.product.name,
        selectedUnit: { label: item.ci.selectedUnit?.label || null, metric: item.ci.selectedUnit?.metric || 'grams', measure: item.ci.selectedUnit?.measure || 0 },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        offerDiscount: item.offerDiscount,
        finalUnitPrice: item.finalUnitPrice,
        subtotal: item.finalUnitPrice * item.quantity,
      }], { session });
      orderItems.push(oi);
    }

    if (appliedCouponData.couponId) {
      await CouponUsage.create([{ couponId: appliedCouponData.couponId, userId, orderId: null }], { session });
      await CouponModel().findByIdAndUpdate(appliedCouponData.couponId, { $inc: { usageCount: 1 } }, { session });
    }

    const addrId = addressId ? new mongoose.Types.ObjectId(addressId) : undefined;
    const [order] = await Order.create([{
      userId,
      totalAmount: totals.subtotal,
      status: "placed",
      paymentMethod: "cod",
      paymentStatus: "pending",
      address: addrId,
      subtotal: totals.subtotal,
      offerDiscount: totals.offerDiscount,
      couponDiscount: totals.couponDiscount,
      grandTotal: totals.grandTotal,
      appliedCoupon: appliedCouponData,
      items: orderItems.map((oi) => ({ orderItemId: oi._id })),
    }], { session });

    for (const oi of orderItems) { oi.orderId = order._id; await oi.save({ session }); }

    if (appliedCouponData.couponId) {
      await CouponUsage.updateMany({ couponId: appliedCouponData.couponId, orderId: null }, { orderId: order._id }, { session });
    }

    await clearCart(cart, session);

    await session.commitTransaction();
    session.endSession();

    return await Order.findById(order._id).populate("items.orderItemId").lean();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const createRazorpayOrder = async (userId, addressId) => {
  const razorpay = require("./razorpay.service");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { cart, validItems } = await validateCheckout(userId);
    if (!validItems.length) throw new ValidationError("No valid items to checkout");

    const pricedItems = [];
    for (const item of validItems) {
      const offer = await resolveBestOffer(item.product._id, item.product.category);
      const { discount, finalPrice } = applyOffer(item.unitPrice, offer);
      pricedItems.push({ ...item, offerDiscount: discount, finalUnitPrice: finalPrice, lineTotal: item.unitPrice * item.quantity, finalLineTotal: finalPrice * item.quantity, offer });
    }

    const afterOfferAmount = pricedItems.reduce((s, i) => s + i.lineTotal, 0) - pricedItems.reduce((s, i) => s + i.offerDiscount * i.quantity, 0);

    let couponDiscount = 0;
    let appliedCouponData = { couponId: null, code: null, discount: 0 };
    if (cart.appliedCoupon?.code) {
      const result = await applyCoupon(cart.appliedCoupon.code, userId, afterOfferAmount);
      if (result.error) throw new ValidationError(result.error);
      couponDiscount = result.discount;
      appliedCouponData = { couponId: result.coupon._id, code: result.coupon.code, discount: result.discount };
    }

    const totals = calculateCartTotals(pricedItems, couponDiscount);

    // Do NOT reserve stock yet — only on payment verification
    const orderItems = [];
    for (const item of pricedItems) {
      const [oi] = await OrderItem.create([{
        productId: item.product._id,
        orderId: null,
        productName: item.product.name,
        selectedUnit: { label: item.ci.selectedUnit?.label || null, metric: item.ci.selectedUnit?.metric || 'grams', measure: item.ci.selectedUnit?.measure || 0 },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        offerDiscount: item.offerDiscount,
        finalUnitPrice: item.finalUnitPrice,
        subtotal: item.finalUnitPrice * item.quantity,
      }], { session });
      orderItems.push(oi);
    }

    if (appliedCouponData.couponId) {
      await CouponUsage.create([{ couponId: appliedCouponData.couponId, userId, orderId: null }], { session });
      await CouponModel().findByIdAndUpdate(appliedCouponData.couponId, { $inc: { usageCount: 1 } }, { session });
    }

    const addrId = addressId ? new mongoose.Types.ObjectId(addressId) : undefined;
    const [order] = await Order.create([{
      userId,
      totalAmount: totals.subtotal,
      status: "pending",
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      address: addrId,
      subtotal: totals.subtotal,
      offerDiscount: totals.offerDiscount,
      couponDiscount: totals.couponDiscount,
      grandTotal: totals.grandTotal,
      appliedCoupon: appliedCouponData,
      items: orderItems.map((oi) => ({ orderItemId: oi._id })),
    }], { session });

    for (const oi of orderItems) { oi.orderId = order._id; await oi.save({ session }); }

    if (appliedCouponData.couponId) {
      await CouponUsage.updateMany({ couponId: appliedCouponData.couponId, orderId: null }, { orderId: order._id }, { session });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.createOrder(totals.grandTotal, order._id.toString());

    // Save razorpayOrderId on the order
    order.razorpayOrderId = razorpayOrder.id;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const verifyPaymentAndCompleteOrder = async (userId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const razorpay = require("./razorpay.service");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const valid = razorpay.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!valid) throw new ValidationError("Payment verification failed");

    const order = await Order.findOne({ razorpayOrderId, userId }).populate("items.orderItemId").session(session);
    if (!order) throw new NotFoundError("Order not found");
    if (order.paymentStatus === "paid") throw new ValidationError("Payment already completed");

    // Reserve stock now
    for (const ref of order.items) {
      const oi = ref.orderItemId;
      if (!oi) continue;
      const required = (oi.selectedUnit?.measure || 0) * (oi.quantity || 0);
      if (required > 0) {
        const updated = await Product.findByIdAndUpdate(
          oi.productId,
          { $inc: { stockIn: -required } },
          { session, new: true },
        );
        if (!updated || updated.stockIn < 0) throw new Error(`Stock reservation failed`);
      }
    }

    order.status = "placed";
    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save({ session });

    // Clear cart
    const cart = await Cart.findOne({ userId }).session(session);
    if (cart) await clearCart(cart, session);

    await session.commitTransaction();
    session.endSession();

    return order;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

module.exports = { createCODOrder, createRazorpayOrder, verifyPaymentAndCompleteOrder, validateCheckout, calculateItemPrice, clearCart };
