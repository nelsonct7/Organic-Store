const User = require("../collections/user.collection");
const Roles = require("../collections/roles.collection");
const { ConflictError, NotFoundError } = require("../shared/utils/error.util");
const { hashPassword, comparePassword } = require("../shared/utils/auth.utils");

const logIn = async (email, password) => {
  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError("User not found");
  }
  // Check password
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new NotFoundError("Invalid credentials");
  }
  return {
    userId: user._id,
    email: user.email,
    name: user.name,
    roles: user.roles || [],
    isMobileVerified:user.isMobileVerified || false,
    isEmailVerified:user.isEmailVerified || false,
  };
};
const register = async (name, email, password, mobile, confirmPassword) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError("Email already in use");
    }
    // hash password
    const hashedPassword = await hashPassword(password);
    const userRole = await Roles.findOne({ name: "user" });
    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      mobile,
      role: userRole._id,
    });
    await newUser.save();
    return newUser._id;
  } catch (err) {
    throw err;
  }
};

module.exports = { logIn, register };
