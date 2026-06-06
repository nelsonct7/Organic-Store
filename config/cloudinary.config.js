const cloudinary = require("cloudinary").v2;
const env = require("./env.config");

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

module.exports = cloudinary;
