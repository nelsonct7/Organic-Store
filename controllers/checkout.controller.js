const checkoutService = require("../services/checkout.service");
const addressService = require("../services/address.service");
const cartService = require("../services/cart.service");
const { sendOTP, verifyOTP } = require("../shared/utils/otp.utils");
const User = require("../collections/user.collection");

const renderCheckoutPage = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/v1/auth/login");

    const result = await cartService.getCart(userId);
    if (!result.items.length) return res.redirect("/cart");

    const addresses = await addressService.getUserAddresses(userId);
    const user = await User.findById(userId).select("mobile isMobileVerified").lean();

    res.render("cart/checkout", {
      title: "Checkout - Organic Store",
      user: req.user,
      sessionUser: req.session.user,
      products: result.items,
      total: result.totals.finalAmount,
      totals: result.totals,
      addresses,
      mobile: user?.mobile || "",
      isMobileVerified: user?.isMobileVerified || false,
    });
  } catch (err) {
    next(err);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const { street, city, state, postalCode, country } = req.body;
    if (!street || !city || !state || !postalCode) {
      return res.status(400).json({ status: false, message: "All required fields must be filled" });
    }

    await addressService.addAddress(userId, { street, city, state, postalCode, country });
    const addresses = await addressService.getUserAddresses(userId);
    res.json({ status: true, addresses });
  } catch (err) {
    next(err);
  }
};

const sendCheckoutOTP = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const user = await User.findById(userId).select("mobile").lean();
    if (!user?.mobile) return res.status(400).json({ status: false, message: "No mobile number on your account" });

    const sent = await sendOTP(user.mobile);
    if (!sent) return res.status(500).json({ status: false, message: "Failed to send OTP" });

    res.json({ status: true, message: "OTP sent" });
  } catch (err) {
    next(err);
  }
};

const verifyCheckoutOTP = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const { code } = req.body;
    if (!code) return res.status(400).json({ status: false, message: "OTP code is required" });

    const user = await User.findById(userId).select("mobile").lean();
    if (!user?.mobile) return res.status(400).json({ status: false, message: "No mobile number on your account" });

    const valid = await verifyOTP(user.mobile, code);
    if (!valid) return res.status(400).json({ status: false, message: "Invalid OTP" });

    await User.findByIdAndUpdate(userId, { isMobileVerified: true });
    res.json({ status: true, message: "Mobile verified" });
  } catch (err) {
    next(err);
  }
};

const createCODOrder = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login first" });

    const { addressId } = req.body;
    if (!addressId) return res.status(400).json({ status: false, message: "Please select a delivery address" });

    const user = await User.findById(userId).select("isMobileVerified").lean();
    if (!user?.isMobileVerified) return res.status(400).json({ status: false, message: "Please verify your mobile number first" });

    const order = await checkoutService.createCODOrder(userId, addressId);

    res.status(201).json({
      status: true,
      message: "Order placed successfully",
      order: { _id: order._id, grandTotal: order.grandTotal, status: order.status, paymentMethod: order.paymentMethod },
    });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ status: false, message: err.message });
    if (err.name === "NotFoundError") return res.status(404).json({ status: false, message: err.message });
    next(err);
  }
};

const createRazorpayOrder = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login first" });

    const { addressId } = req.body;
    if (!addressId) return res.status(400).json({ status: false, message: "Please select a delivery address" });

    const user = await User.findById(userId).select("isMobileVerified").lean();
    if (!user?.isMobileVerified) return res.status(400).json({ status: false, message: "Please verify your mobile number first" });

    const env = require("../config/env.config");
    const result = await checkoutService.createRazorpayOrder(userId, addressId);

    res.status(201).json({
      status: true,
      key_id: env.razorpayKeyId,
      order_id: result.razorpayOrderId,
      amount: result.amount,
      currency: result.currency,
      orderId: result.orderId,
    });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ status: false, message: err.message });
    if (err.name === "NotFoundError") return res.status(404).json({ status: false, message: err.message });
    next(err);
  }
};

const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login first" });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: false, message: "Missing payment details" });
    }

    await checkoutService.verifyPaymentAndCompleteOrder(userId, razorpay_order_id, razorpay_payment_id, razorpay_signature);
    res.json({ status: true, message: "Payment successful" });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ status: false, message: err.message });
    if (err.name === "NotFoundError") return res.status(404).json({ status: false, message: err.message });
    next(err);
  }
};

module.exports = { renderCheckoutPage, addAddress, sendCheckoutOTP, verifyCheckoutOTP, createCODOrder, createRazorpayOrder, verifyRazorpayPayment };
