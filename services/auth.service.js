const User = require("../collections/user.collection");
const Roles = require("../collections/roles.collection");
const { ConflictError, NotFoundError } = require("../shared/utils/error.util");
const { hashPassword, comparePassword } = require("../shared/utils/auth.utils");

const logIn = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError("User not found");
  }
  if (user.authProvider === "google") {
    throw new NotFoundError("This account uses Google login. Please sign in with Google.");
  }
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new NotFoundError("Invalid credentials");
  }
  return {
    userId: user._id,
    email: user.email,
    name: user.name,
    roles: user.roles || [],
    authProvider: user.authProvider || "local",
    isMobileVerified:user.isMobileVerified || false,
    isEmailVerified:user.isEmailVerified || false,
  };
};
const register = async (name, email, password, mobile, confirmPassword) => {
  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new ConflictError("Email already in use");
    }
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      throw new ConflictError("Mobile number already in use");
    }
    const hashedPassword = await hashPassword(password);
    const userRole = await Roles.findOne({ name: "user" });
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
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      throw new ConflictError(`${field === "email" ? "Email" : "Mobile number"} already in use`);
    }
    throw err;
  }
};

module.exports = { logIn, register };
