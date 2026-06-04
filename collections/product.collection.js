const mongoose = require("mongoose");
const { productMetrics } = require("../config/constants.config");
const Schema = mongoose.Schema;
const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: null,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    metrics: {
      type: String,
      enum: Array.from(Object.values(productMetrics)),
      default: "/Piece",
    },
    offers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Offer",
      },
    ],
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    images: [
      {
        id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    storageSpec: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["available", "out-of-stock"],
      default: "available",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Product", productSchema, "product");
