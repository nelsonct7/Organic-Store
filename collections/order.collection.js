const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "placed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
    address: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online", "razorpay"],
      default: "cod",
    },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    offerDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    appliedCoupon: {
      couponId: { type: Schema.Types.ObjectId, ref: "Coupon", default: null },
      code: { type: String, default: null },
      discount: { type: Number, default: 0 },
    },
    items: [
      {
        orderItemId: {
          type: Schema.Types.ObjectId,
          ref: "OrderItem",
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);
module.exports = mongoose.model("Order", orderSchema, "order");
