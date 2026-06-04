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
} = require("../shared/validators/admin.validator");
const {
  categoryImgStore,
  productImgStore,
  bannerImgStore,
} = require("../middlewares/multer.middleware");

const ctrl = require("../controllers/admin.controller");

/* ---- Auth (no admin guard) ---- */
router.get("/", ctrl.renderAdminLogin);
router.post("/login", validationMiddleware(adminLoginSchema), ctrl.postAdminLogin);
router.get("/logout", ctrl.adminLogout);

/* ---- Dashboard ---- */
router.get("/home", validateAdminAccess, ctrl.renderAdminHome);

/* ---- Products ---- */
router.get("/view-products", validateAdminAccess,validationMiddleware(getAdminDataPaginationSchema), ctrl.renderAdminViewProduct);
router.get("/add-products", validateAdminAccess, ctrl.renderAdminAddProduct);
router.post(
  "/add-products",
  validateAdminAccess,
  productImgStore.array("image", 10),
  validationMiddleware(addProductSchema),
  ctrl.postAdminAddProduct
);
router.get("/edit-product/:id", validateAdminAccess, ctrl.renderAdminEditProduct);
router.post(
  "/edit-products/:id",
  validateAdminAccess,
  productImgStore.array("image", 10),
  validationMiddleware(editProductSchema),
  ctrl.postAdminEditProduct
);
router.get("/delete-product/:id", validateAdminAccess, ctrl.deleteProduct);

/* ---- Users ---- */
router.get("/view-users", validateAdminAccess, ctrl.renderAdminViewUsers);
router.get("/add-users", validateAdminAccess, ctrl.renderAdminAddUser);
router.post("/add-users", validateAdminAccess, validationMiddleware(addUserSchema), ctrl.postAdminAddUser);
router.get("/edit-user/:id", validateAdminAccess, ctrl.renderAdminEditUser);
router.post("/edit-users/:id", validateAdminAccess, ctrl.postAdminEditUser);
router.get("/delete-user/:id", validateAdminAccess, ctrl.deleteUser);

/* ---- Categories ---- */
router.get("/view-category", validateAdminAccess,validationMiddleware(getAdminDataPaginationSchema),ctrl.renderViewCategory);
router.get("/add-category", validateAdminAccess, ctrl.renderAddCategory);
router.post(
  "/add-category",
  validateAdminAccess,
  categoryImgStore.single("category_image"),
  validationMiddleware(addCategorySchema),
  ctrl.postAddCategory
);
router.get("/edit-category/:id", validateAdminAccess, ctrl.renderEditCategory);
router.post(
  "/edit-category/:id",
  validateAdminAccess,
  categoryImgStore.single("category_image"),
  validationMiddleware(addCategorySchema),
  ctrl.postEditCategory
);
router.get("/delete-category/", validateAdminAccess, ctrl.deleteCategory);

/* ---- Category Offers ---- */
router.get("/view-category-offer", validateAdminAccess, ctrl.renderViewCategoryOffer);
router.get("/add-cat-offer/:id", validateAdminAccess, ctrl.renderAddCatOffer);
router.post("/add-cat-offer", validateAdminAccess, ctrl.postAddCatOffer);
router.post("/remove-cat-offer/:id", validateAdminAccess, ctrl.removeCatOffer);

/* ---- Orders ---- */
router.get("/view-orders", validateAdminAccess, ctrl.renderViewOrders);
router.get("/edit-order/:id", validateAdminAccess, ctrl.renderEditOrder);
router.post("/update-order", validateAdminAccess, ctrl.postUpdateOrder);
router.get("/delete-order/:id", validateAdminAccess, ctrl.deleteOrder);

/* ---- Coupons ---- */
router.get("/coupons", validateAdminAccess, ctrl.renderCoupons);
router.get("/add-coupons", validateAdminAccess, ctrl.renderAddCoupon);
router.post("/add-coupons", validateAdminAccess, validationMiddleware(addCouponSchema), ctrl.postAddCoupon);
router.post("/remove-coupons/:id", validateAdminAccess, ctrl.removeCoupon);

/* ---- Banners ---- */
router.get("/banner", validateAdminAccess, ctrl.renderBanners);
router.get("/add-banner", validateAdminAccess, ctrl.renderAddBanner);
router.post("/add-banner", validateAdminAccess, bannerImgStore.single("banner_image"), ctrl.postAddBanner);
router.get("/delete-banner/:id", validateAdminAccess, ctrl.deleteBanner);

/* ---- Product Offers ---- */
router.get("/product-offers", validateAdminAccess, ctrl.renderProductOffers);
router.get("/add-offer/:id", validateAdminAccess, ctrl.renderAddOffer);
router.post("/add-offer", validateAdminAccess, ctrl.postAddOffer);
router.get("/remove-offer/:id", validateAdminAccess, ctrl.removeOffer);

/* ---- Feedback & Messages ---- */
router.get("/admin-feedback", validateAdminAccess, ctrl.renderFeedback);
router.get("/view-message", validateAdminAccess, ctrl.renderMessages);

/* ---- Reports ---- */
router.get("/reports", validateAdminAccess, ctrl.renderReports);
router.post("/get-line-data", validateAdminAccess, ctrl.getLineData);

/* ---- Offers control page ---- */
router.get("/view-offers", validateAdminAccess, ctrl.renderOfferControl);

module.exports = router;
