const User = require("../collections/user.collection");
const { hashPassword, comparePassword } = require("../shared/utils/auth.utils");
const authService = require("../services/auth.service");

const renderLogin = (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render("auth/login", {
    title: "Login",
    layout: "authLayout",
  });
};

const renderRegister = (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render("auth/register", {
    title: "Register",
    layout: "authLayout",
  });
};

const { NotFoundError, ConflictError } = require("../shared/utils/error.util");

const register = async (req, res, next) => {
  try {
    const { name, email, password, mobile, confirmPassword } = req.body;
    await authService.register(name, email, password, mobile, confirmPassword);
    req.flash("success", "Registration successful! Please log in with your credentials.");
    res.redirect("/v1/auth/login");
  } catch (err) {
    if (err instanceof ConflictError) {
      req.flash("error", err.message);
      return res.redirect("/v1/auth/register");
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.logIn(email, password);
    req.session.userId = user.userId;
    req.session.user = user;
    res.redirect("/");
  } catch (err) {
    if (err instanceof NotFoundError) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/v1/auth/login");
    }
    next(err);
  }
};

const logout = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      req.logout((err) => (err ? reject(err) : resolve()));
    });
    await new Promise((resolve, reject) => {
      req.session.destroy((err) => (err ? reject(err) : resolve()));
    });
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Error logging out:", err);
    res.status(500).json({
      success: false,
      message: "Error logging out. Please try again.",
    });
  }
};

module.exports = {
  renderLogin,
  renderRegister,
  register,
  login,
  logout,
};
