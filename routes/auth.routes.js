const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");
const { validationMiddleware } = require("../shared/utils/validation.utils");
const {
  logInSchema,
  registerSchema,
} = require("../shared/validators/auth.validator");

router.get("/login", authController.renderLogin);
router.get("/register", authController.renderRegister);

router.post(
  "/register",
  validationMiddleware(registerSchema),
  authController.register,
);
router.post("/login", validationMiddleware(logInSchema), authController.login);

module.exports = router;