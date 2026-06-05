const mongoose = require("mongoose");

const couponUsageSchema = new mongoose.Schema(
  {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },

    couponCode: {
      type: String,
      required: true,
    },

    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
    },

    discountAmountApplied: {
      type: Number,
      required: true,
    },

    orderAmount: {
      type: Number,
      required: true,
    },

    finalAmount: {
      type: Number,
      required: true,
    },

    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful indexes
couponUsageSchema.index({ couponId: 1, userId: 1 });
couponUsageSchema.index({ userId: 1 });
couponUsageSchema.index({ couponId: 1 });

module.exports = mongoose.model("CouponUsage", couponUsageSchema);