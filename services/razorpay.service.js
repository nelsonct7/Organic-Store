const Razorpay = require("razorpay");
const crypto = require("crypto");
const env = require("../config/env.config");

let instance;
if (env.razorpayKeyId && env.razorpayKeyId !== "your-razorpay-key-id") {
  instance = new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  });
}

const createOrder = async (amount, receipt) => {
  if (!instance) throw new Error("Razorpay not configured");
  const options = {
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: receipt || "" + Date.now(),
  };
  return instance.orders.create(options);
};

const verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const hmac = crypto.createHmac("sha256", env.razorpayKeySecret);
  hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
  return hmac.digest("hex") === razorpaySignature;
};

module.exports = { createOrder, verifyPayment };
