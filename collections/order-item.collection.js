const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    productName: {
      type: String,
      default: null,
    },
    selectedUnit: {
      label: { type: String, default: null },
      metric: { type: String, enum: ['grams', 'ml', 'numbers'], default: 'grams' },
      measure: { type: Number, default: 0 },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    offerDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalUnitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("OrderItem", orderItemSchema, "order_items");
