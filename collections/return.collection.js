const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const returnItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
}, { _id: false });

const returnSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [returnItemSchema],
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "refunded"],
      default: "requested",
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    adminNote: {
      type: String,
      default: "",
    },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Return", returnSchema, "returns");
