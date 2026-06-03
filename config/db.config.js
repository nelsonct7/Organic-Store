const mongoose = require("mongoose");
const env = require("./env.config");

const connect_to_db = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

module.exports = { connect_to_db };
