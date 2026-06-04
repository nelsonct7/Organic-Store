const { productMetrics } = require("../../config/constants.config");
const { validateObjectId } = require("../utils/mongo.utils");

const isEmptyPayload=(_, { req }) => {
        if (Object.keys(req.body).length === 0) {
          throw new Error("No fields provided for update");
        }
        return true;
      }

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
        options: Array.from(Object.values(productMetrics)),
      },
    },
    status: {
      required: true,
      isIn: {
        options: ["available", "out-of-stock"],
      },
    },
  },
};

const editProductSchema = {
  body: {
    custom: {
      options: isEmptyPayload,
    },
    title: {
      optional: true,
      isString: true,
    },
    price: {
      optional: true,
      isNumeric: true,
    },
    category: {
      optional: true,
    },
    description: {
      optional: true,
      isLength: { options: { max: 150 } },
    },
    storageSpec: {
      optional: true,
      isLength: { options: { max: 150 } },
    },
    stock: {
      optional: true,
      isInt: {
        options: { min: 0, max: 99999 },
      },
    },
    metrics: {
      optional: true,
      isIn: {
        options: Object.values(productMetrics),
      },
    },
    status: {
      optional: true,
      isIn: {
        options: ["available", "out-of-stock"],
      },
    },
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
        options: ["asc", "desc"],
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

const deleteProductImageSchema = {
  body: {
    productId: {
      in: ["body"],
      notEmpty: { errorMessage: "Product ID is required" },
      custom: { options: validateObjectId },
    },
    imageId: {
      in: ["body"],
      notEmpty: { errorMessage: "Image ID is required" },
      isString: true,
      trim: true,
    },
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
  mongoIdSchema,
  deleteProductImageSchema,
};
