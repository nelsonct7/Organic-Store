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
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Cart", cartSchema, "cart");
