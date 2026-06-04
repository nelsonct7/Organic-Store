const {ObjectId} = require('mongodb')

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

module.exports = { validateObjectId };
