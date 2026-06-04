const { productMetrics } = require("../../config/constants.config");
const {validateObjectId} = require('../utils/mongo.utils')

const adminLoginSchema = {
  body: {
    admin_field: { required: true },
    admin_password: { required: true, isLength: { min: 3 } },
  },
};

const addProductSchema = {
  body: {
    title: { required: true },
    price: { required: true, isNumeric: true, isLength: { min: 1 } },
    category: { required: true },
    description: { optional: true, isLength: { max: 150 } },
    storageSpec: { optional: true, isLength: { max: 150 } },
    stock: {
      required: true,
      isNumeric: true,
      isInt: {
        options: { min: 10, max: 1500 },
      },
    },
    metrics: {
      required: true,
      isIn: {
        options: [Array.from(Object.values(productMetrics))],
      },
    },
    status: {
      required: true,
      isIn: {
        options: [["available", "out-of-stock"]],
      },
    },
  },
};

const editProductSchema = {
  body: {
    title: { required: true },
    price: { required: true, isNumeric: true },
  },
};
const mongoIdSchema = {
  params: {
    id: {
      in: ["params"],
      notEmpty: {
        errorMessage: "Product id is required",
      },
      custom: {
        options: validateObjectId,
      },
    },
  },
};

const addUserSchema = {
  body: {
    user_name: { required: true, isLength: { min: 2 } },
    user_email: { required: true, isEmail: true },
    user_mobile: {
      required: true,
      isNumeric: true,
      isLength: { min: 10, max: 15 },
    },
    user_password: { required: true, isLength: { min: 6 } },
  },
};

const addCategorySchema = {
  body: {
    categoryname: { required: true },
  },
};

const getAdminDataPaginationSchema = {
  query: {
    page: {
      optional: true,
      isInt: {
        options: { min: 0 },
      },
      toInt: true,
    },
    limit: {
      optional: true,
      isInt: {
        options: { min: 1, max: 100 },
      },
      toInt: true,
    },
    sort: {
      optional: true,
      isString: true,
      trim: true,
    },
    order: {
      optional: true,
      isIn: {
        options: [["asc", "desc"]],
      },
    },
    search: {
      optional: true,
      isString: true,
      trim: true,
    },
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
  getAdminDataPaginationSchema,
  mongoIdSchema
};
