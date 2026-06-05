const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: [
      {
        cartItemId: {
          type: Schema.Types.ObjectId,
          ref: "CartItem",
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    appliedCoupon: {
      couponId: { type: Schema.Types.ObjectId, ref: "Coupon", default: null },
      code: { type: String, default: null },
      discount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Cart", cartSchema, "cart");
