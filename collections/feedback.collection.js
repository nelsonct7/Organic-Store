const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const feedbackSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["platform", "product"],
      default: "platform",
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
    adminNote: {
      type: String,
      default: "",
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("UserFeedback", feedbackSchema, "user_feedback");
