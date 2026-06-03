const dotenv = require("dotenv");
dotenv.config();

// Type-safe environment variable helpers
const getEnvString = (key, defaultValue = "") => {
  return process.env[key] ?? defaultValue;
};

const getEnvNumber = (key, defaultValue) => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

const getEnvBoolean = (key, defaultValue = false) => {
  const value = process.env[key];
  return value ? value.toLowerCase() === "true" : defaultValue;
};

const getEnvArray = (key, delimiter = ",", defaultValue = []) => {
  const value = process.env[key];
  return value
    ? value.split(delimiter).map((item) => item.trim())
    : defaultValue;
};

const validateEnvVariables = (requiredKeys) => {
  const missingKeys = requiredKeys.filter((key) => !process.env[key]);
  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingKeys.join(", ")}`,
    );
  }
};

module.exports = {
  getEnvString,
  getEnvNumber,
  getEnvBoolean,
  getEnvArray,
  validateEnvVariables,
};
