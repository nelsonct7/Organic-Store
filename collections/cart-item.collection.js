const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const cartItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    cartId: {
      type: Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    selectedUnit: {
      label: { type: String, default: null },
      metric: { type: String, enum: ['grams', 'ml', 'numbers'], default: 'grams' },
      measure: { type: Number, default: 0 },
      price: { type: Number, default: 0 },
    },
    appliedOffer: {
      offerId: { type: Schema.Types.ObjectId, ref: "Offer", default: null },
      type: { type: String, default: null },
      value: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
    },
    finalUnitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    offPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("CartItem", cartItemSchema, "cart_item");
