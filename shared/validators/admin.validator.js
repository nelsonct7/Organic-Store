const adminLoginSchema = {
  body: {
    admin_field: { required: true },
    admin_password: { required: true, isLength: { min: 3 } },
  },
};

const addProductSchema = {
  body: {
    title: { required: true },
    price: { required: true, isNumeric: true },
    category: { required: true },
    "godown-stock": { optional: true, isNumeric: true },
  },
};

const editProductSchema = {
  body: {
    title: { required: true },
    price: { required: true, isNumeric: true },
  },
};

const addUserSchema = {
  body: {
    user_name: { required: true, isLength: { min: 2 } },
    user_email: { required: true, isEmail: true },
    user_mobile: { required: true, isNumeric: true, isLength: { min: 10, max: 15 } },
    user_password: { required: true, isLength: { min: 6 } },
  },
};

const addCategorySchema = {
  body: {
    categoryname: { required: true },
  },
};

const addCouponSchema = {
  body: {
    couponcode: { required: true },
    offer: { required: true, isNumeric: true },
  },
};

module.exports = {
  adminLoginSchema,
  addProductSchema,
  editProductSchema,
  addUserSchema,
  addCategorySchema,
  addCouponSchema,
};
