const Address = require("../collections/user.address.collection");

const getUserAddresses = async (userId) => {
  return Address.find({ userId, isDeleted: false, isActive: true }).lean();
};

const addAddress = async (userId, data) => {
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

module.exports = { getUserAddresses, addAddress, setDefaultAddress };
