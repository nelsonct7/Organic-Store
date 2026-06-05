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
      default: "Piece",
    },
    // if the metrics is Kg => all units should be defined in grams,
    // if the metric is Li=>all units should be ml, if metric is piece=> sub unit should be defined in numbers, like egs, => 10,5,2 ..etc
    availableUnits: [
      {
        label: { type: String, required: true },
        metric: {
          type: String,
          enum: ['grams','ml','numbers'],
          default: "Piece",
        },
        measure: { type: Number, required: true, min: 0 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    // stock converted from kg=>grams, litter=>ml, piece=numbers
    stockIn: {
      type: Number,
      default: 0,
      min: 0,
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
