const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const emailSubSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  email: { type: String, required: true, unique: true, index: true },
},{
    timestamps: true,
  });

  module.exports=mongoose.model("EmailSub", cartSchema, "email_sub");