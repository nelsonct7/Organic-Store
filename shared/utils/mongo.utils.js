const { ObjectId } = require("mongodb");

const validateObjectId = (value) => {
  if (!ObjectId.isValid(value)) {
    throw new Error("Invalid ObjectId format");
  }
  // Ensure the string doesn't change when cast to ObjectId
  if (String(new ObjectId(value)) !== value) {
    throw new Error("Invalid ObjectId");
  }
  return true;
};

const createUpdatablePayload = (
  newPayload = {},
  oldObject = {},
  nonUpdatableFields = ["_id", "createdAt", "updatedAt"],
) => {
  const updatedFields = {};

  for (const [key, value] of Object.entries(newPayload)) {
    if (!nonUpdatableFields.includes(key) && value !== oldObject[key]) {
      updatedFields[key] = value;
    }
  }

  return updatedFields;
};
module.exports = { validateObjectId, createUpdatablePayload };
