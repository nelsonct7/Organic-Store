const logInSchema = {
  body: {
    email: { required: true, isEmail: true },
    password: { required: true, isLength: { min: 6, max: 20 } },
  },
  query: {
    rememberMe: { optional: true, isBoolean: true },
  },
};
const registerSchema = {
  body: {
    name: { required: true, isLength: { min: 2, max: 50 } },
    email: { required: true, isEmail: true },
    mobile: { required: true, isNumeric: true, isLength: { min: 10, max: 15 } },
    password: { required: true, isLength: { min: 6, max: 20 } },
    confirmPassword: { required: true, isLength: { min: 6, max: 20 } },
  },
};

module.exports = {
  logInSchema,
  registerSchema,
};