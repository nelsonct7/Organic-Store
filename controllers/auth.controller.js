const User = require("../collections/user.collection");
const { hashPassword, comparePassword } = require("../shared/utils/auth.utils");
const authService = require("../services/auth.service");

const renderLogin = (req, res) => {
  res.render("auth/login", {
    title: "Login",
    layout: "authLayout",
  });
};

const renderRegister = (req, res) => {
  res.render("auth/register", {
    title: "Register",
    layout: "authLayout",
  });
};

const register = async (req, res, next) => {
  try {
    // the fields are validated by the validation middleware, 
    // so we can safely access them here
    const { name, email, password, mobile, confirmPassword } = req.body;
    const userId = await authService.register(
      name,
      email,
      password,
      mobile,
      confirmPassword,
    );
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: userId,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await authService.logIn(email, password);
    // Set user session
    req.session.userId = user.userId;
    req.session.user=user;
    res.json({
      success: true,
      message: "Logged in successfully",
      user
    });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({
        success: false,
        message: "Error logging out. Please try again.",
      });
    }
    res.clearCookie("connect.sid");
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });
};

module.exports = {
  renderLogin,
  renderRegister,
  register,
  login,
  logout,
};
