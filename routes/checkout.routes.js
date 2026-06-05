const express = require("express");
const {
  renderCheckoutPage, addAddress, sendCheckoutOTP, verifyCheckoutOTP,
  createCODOrder, createRazorpayOrder, verifyRazorpayPayment,
} = require("../controllers/checkout.controller");

const router = express.Router();

router.get("/checkout", renderCheckoutPage);
router.post("/checkout/address", addAddress);
router.post("/checkout/send-otp", sendCheckoutOTP);
router.post("/checkout/verify-otp", verifyCheckoutOTP);
router.post("/checkout/cod", createCODOrder);
router.post("/checkout/razorpay/order", createRazorpayOrder);
router.post("/checkout/razorpay/verify", verifyRazorpayPayment);

module.exports = router;
