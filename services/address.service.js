const Address = require("../collections/user.address.collection");
const { isPincodeServiceable } = require("../shared/utils/pincode.utils");
const { ValidationError } = require("../shared/utils/error.util");

const getUserAddresses = async (userId) => {
  return Address.find({ userId, isDeleted: false, isActive: true }).lean();
};

const addAddress = async (userId, data) => {
  if (!isPincodeServiceable(data.postalCode)) {
    throw new ValidationError("Delivery not available to your area");
  }

  const existingCount = await Address.countDocuments({ userId, isDeleted: false });
  const address = await Address.create({
    userId,
    street: data.street,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    country: data.country || "India",
    isDefault: existingCount === 0,
  });
  return address;
};

const setDefaultAddress = async (userId, addressId) => {
  await Address.updateMany({ userId }, { $set: { isDefault: false } });
  await Address.findByIdAndUpdate(addressId, { $set: { isDefault: true } });
};

const updateAddress = async (addressId, userId, data) => {
  if (data.postalCode && !isPincodeServiceable(data.postalCode)) {
    throw new ValidationError("Delivery not available to your area");
  }
  const address = await Address.findOneAndUpdate(
    { _id: addressId, userId, isDeleted: false },
    { $set: { street: data.street, city: data.city, state: data.state, postalCode: data.postalCode, country: data.country || "India" } },
    { new: true, runValidators: true },
  ).lean();
  if (!address) throw new ValidationError("Address not found");
  return address;
};

const deleteAddress = async (addressId, userId) => {
  const address = await Address.findOneAndUpdate(
    { _id: addressId, userId, isDeleted: false },
    { $set: { isDeleted: true, isActive: false } },
    { new: true },
  ).lean();
  if (!address) throw new ValidationError("Address not found");
  return address;
};

module.exports = { getUserAddresses, addAddress, setDefaultAddress, updateAddress, deleteAddress };
