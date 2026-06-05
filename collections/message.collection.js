const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ["open", "replied", "closed"],
      default: "open",
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ["user", "admin"],
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: 2000,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("UserMessage", messageSchema, "user_messages");
