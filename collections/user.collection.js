const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      index: true,
    },
    roles: {
      type: [String],
      default: ["user"],
    },
    profilePicture: {
      type: String,
      default: null,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema, "users");
module.exports = User;
