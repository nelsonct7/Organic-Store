const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: null,
    },
    imageUrl: { type: String, default: null },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isSubCategory: {
      type: Boolean,
      default: false,
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    childCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Category", categorySchema, "category");
