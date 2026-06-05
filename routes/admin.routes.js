const express = require("express");
const router = express.Router();

const { validateAdminAccess } = require("../middlewares/auth.middleware");
const { validationMiddleware } = require("../shared/utils/validation.utils");
const {
  adminLoginSchema,
  addProductSchema,
  editProductSchema,
  addUserSchema,
  addCategorySchema,
  addCouponSchema,
  getAdminDataPaginationSchema,
  mongoIdSchema,
  deleteProductImageSchema,
} = require("../shared/validators/admin.validator");
const {
  categoryImgStore,
  productImgStore,
  bannerImgStore,
} = require("../middlewares/multer.middleware");

const ctrl = require("../controllers/admin.controller");

/* ---- Auth (no admin guard) ---- */
router.get("/", ctrl.renderAdminLogin);
router.post(
  "/login",
  validationMiddleware(adminLoginSchema),
  ctrl.postAdminLogin,
);
router.get("/logout", ctrl.adminLogout);

/* ---- Dashboard ---- */
router.get("/home", validateAdminAccess, ctrl.renderAdminHome);

/* ---- Products ---- */
router.get(
  "/view-products",
  validateAdminAccess,
  validationMiddleware(getAdminDataPaginationSchema),
  ctrl.renderAdminViewProduct,
);
router.get("/add-products", validateAdminAccess, ctrl.renderAdminAddProduct);
router.post(
  "/add-products",
  validateAdminAccess,
  productImgStore.array("image", 10),
  validationMiddleware(addProductSchema),
  ctrl.postAdminAddProduct,
);
router.get(
  "/edit-product/:id",
  validateAdminAccess,
  ctrl.renderAdminEditProduct,
);
router.post(
  "/edit-products/:id",
  validateAdminAccess,
  validationMiddleware(editProductSchema),
  productImgStore.array("image", 10),
  ctrl.postAdminEditProduct,
);
router.delete(
  "/delete-product/:id",
  validateAdminAccess,
  validationMiddleware(mongoIdSchema),
  ctrl.deleteProduct,
);
router.post(
  "/delete-product-image",
  validateAdminAccess,
  validationMiddleware(deleteProductImageSchema),
  ctrl.deleteProductImage,
);

/* ---- Users ---- */
router.get("/view-users", validateAdminAccess, ctrl.renderAdminViewUsers);
router.get("/add-users", validateAdminAccess, ctrl.renderAdminAddUser);
router.post(
  "/add-users",
  validateAdminAccess,
  validationMiddleware(addUserSchema),
  ctrl.postAdminAddUser,
);
router.get(
  "/edit-user/:id",
  validateAdminAccess,
  validationMiddleware(mongoIdSchema),
  ctrl.renderAdminEditUser,
);
router.post("/edit-users/:id", validateAdminAccess,validationMiddleware(mongoIdSchema), ctrl.postAdminEditUser);
router.delete(
  "/delete-user/:id",
  validateAdminAccess,
  validationMiddleware(mongoIdSchema),
  ctrl.deleteUser,
);

/* ---- Categories ---- */
router.get(
  "/view-category",
  validateAdminAccess,
  validationMiddleware(getAdminDataPaginationSchema),
  ctrl.renderViewCategory,
);
router.get("/add-category", validateAdminAccess, ctrl.renderAddCategory);
router.post(
  "/add-category",
  validateAdminAccess,
  categoryImgStore.single("category_image"),
  validationMiddleware(addCategorySchema),
  ctrl.postAddCategory,
);
router.get(
  "/edit-category/:id",
  validateAdminAccess,
  validationMiddleware(mongoIdSchema),
  ctrl.renderEditCategory,
);
router.post(
  "/edit-category/:id",
  validateAdminAccess,
  categoryImgStore.single("category_image"),
  validationMiddleware(addCategorySchema),
  ctrl.postEditCategory,
);
router.delete(
  "/delete-category/:id",
  validateAdminAccess,
  validationMiddleware(mongoIdSchema),
  ctrl.deleteCategory,
);

/* ---- Category Offers ---- */
router.get(
  "/view-category-offer",
  validateAdminAccess,
  ctrl.renderViewCategoryOffer,
);
router.get(
  "/add-cat-offer/:id",
  validateAdminAccess,
  ctrl.renderAddCatOffer,
);
router.post("/add-cat-offer", validateAdminAccess, ctrl.postAddCatOffer);
router.delete(
  "/remove-cat-offer/:id",
  validateAdminAccess,
  validationMiddleware(mongoIdSchema),
  ctrl.removeCatOffer,
);

/* ---- Orders ---- */
router.get("/view-orders", validateAdminAccess, ctrl.renderViewOrders);
router.get(
  "/edit-order/:id",
  validateAdminAccess,
  ctrl.renderEditOrder,
);
router.post("/update-order", validateAdminAccess, ctrl.postUpdateOrder);
router.delete(
  "/delete-order/:id",
  validateAdminAccess,
  validationMiddleware(mongoIdSchema),
  ctrl.deleteOrder,
);

/* ---- Coupons ---- */
router.get("/coupons", validateAdminAccess, ctrl.renderCoupons);
router.get("/add-coupons", validateAdminAccess, ctrl.renderAddCoupon);
router.post(
  "/add-coupons",
  validateAdminAccess,
  validationMiddleware(addCouponSchema),
  ctrl.postAddCoupon,
);
router.delete(
  "/remove-coupons/:id",
  validateAdminAccess,
  validationMiddleware(mongoIdSchema),
  ctrl.removeCoupon,
);

/* ---- Banners ---- */
router.get("/banner", validateAdminAccess, ctrl.renderBanners);
router.get("/add-banner", validateAdminAccess, ctrl.renderAddBanner);
router.post(
  "/add-banner",
  validateAdminAccess,
  bannerImgStore.single("banner_image"),
  ctrl.postAddBanner,
);
router.delete(
  "/delete-banner/:id",
  validateAdminAccess,
  validationMiddleware(mongoIdSchema),
  ctrl.deleteBanner,
);

/* ---- Product Offers ---- */
router.get("/product-offers", validateAdminAccess, ctrl.renderProductOffers);
router.get("/add-offer/:id", validateAdminAccess, ctrl.renderAddOffer);
router.post("/add-offer", validateAdminAccess, ctrl.postAddOffer);
router.delete(
  "/remove-offer/:id",
  validateAdminAccess,
  validationMiddleware(mongoIdSchema),
  ctrl.removeOffer,
);

/* ---- Feedback & Messages ---- */
router.get("/admin-feedback", validateAdminAccess, ctrl.renderFeedback);
router.get("/view-message", validateAdminAccess, ctrl.renderMessages);

/* ---- Reports ---- */
router.get("/reports", validateAdminAccess, ctrl.renderReports);
router.post("/get-line-data", validateAdminAccess, ctrl.getLineData);

/* ---- Offers control page ---- */
router.get("/view-offers", validateAdminAccess, ctrl.renderOfferControl);

/* ---- Reviews ---- */
router.get(
  "/reviews",
  validateAdminAccess,
  validationMiddleware(getAdminDataPaginationSchema),
  ctrl.renderAdminReviews,
);
router.get(
  "/reviews/:productId",
  validateAdminAccess,
  validationMiddleware(getAdminDataPaginationSchema),
  ctrl.renderAdminProductReviews,
);
router.post(
  "/review/toggle-approval/:id",
  validateAdminAccess,
  validationMiddleware(mongoIdSchema),
  ctrl.postToggleReviewApproval,
);

module.exports = router;
