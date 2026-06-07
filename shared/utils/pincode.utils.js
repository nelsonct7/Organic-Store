const { SERVICEABLE_PINCODES } = require("../../config/constants.config");

const isPincodeServiceable = (pincode) => {
  if (!pincode) return false;
  const normalized = String(pincode).trim();
  return SERVICEABLE_PINCODES.includes(normalized);
};

module.exports = { isPincodeServiceable };