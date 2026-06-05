const mongoose = require("mongoose");
const env = require("./env.config");

const connect_to_db = async () => {
  try {
    const uri = env.mongoUri.includes("?")
      ? env.mongoUri + "&retryWrites=false"
      : env.mongoUri + "?retryWrites=false";
    const connection = await mongoose.connect(uri);
    console.log("Connected to MongoDB");
    return connection;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

module.exports = { connect_to_db };
