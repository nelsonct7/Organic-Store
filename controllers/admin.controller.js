const mongoose = require("mongoose");
const { productMetrics } = require("../config/constants.config");
const adminService = require("../services/admin.service");

const notFoundConfig = {
  product:    { backLink: "/admin/view-products", backText: "Back to Products" },
  user:       { backLink: "/admin/view-users",    backText: "Back to Users" },
  category:   { backLink: "/admin/view-category", backText: "Back to Categories" },
  order:      { backLink: "/admin/view-orders",   backText: "Back to Orders" },
  banner:     { backLink: "/admin/banner",        backText: "Back to Banners" },
  coupon:     { backLink: "/admin/coupons",       backText: "Back to Coupons" },
  offer:      { backLink: "/admin/product-offers", backText: "Back to Offers" },
};

const renderNotFound = (res, itemType, message) => {
  const cfg = notFoundConfig[itemType] || { backLink: "/admin/home", backText: "Dashboard" };
  const label = itemType.charAt(0).toUpperCase() + itemType.slice(1);
  res.status(404).render("errors/admin-not-found", {
    layout: false,
    title: `${label} Not Found - Organic Store`,
    itemType: label,
    message: message || `The ${itemType} you are looking for does not exist or has been removed.`,
    backLink: cfg.backLink,
    backText: cfg.backText,
  });
};

/* ---- Auth ---- */
const renderAdminLogin = async (req, res, next) => {
  try {
    if (req.session.isAdmin) return res.redirect("/admin/home");
    res.render("admin/auth/admin-login", {
      title: "Admin Login - Organic Store",
      admin: true,
      adminLogin: true,
    });
  } catch (error) {
    next(error);
  }
};

const postAdminLogin = async (req, res, next) => {
  try {
    const { admin_field, admin_password } = req.body;
    const result = await adminService.adminLogin(admin_field, admin_password);
    if (result.status) {
      req.session.isAdmin = true;
      req.session.admin = result.admin;
      return res.redirect("/admin/home");
    }
    req.flash("error", "Invalid credentials");
    res.redirect("/admin");
  } catch (error) {
    next(error);
  }
};

const adminLogout = async (req, res, next) => {
  try {
    req.session.isAdmin = false;
    req.session.admin = null;
    res.redirect("/admin");
  } catch (error) {
    next(error);
  }
};

/* ---- Dashboard ---- */
const renderAdminHome = async (req, res, next) => {
  try {
    const { dashData, mostSelling } = await adminService.getDashboardStats();
    res.render("admin/index", {
      title: "Dashboard - Organic Store",
      admin: true,
      adminData: req.session.admin,
      dashData,
      mostSelling,
    });
  } catch (error) {
    next(error);
  }
};

/* ---- Products ---- */
const renderAdminViewProduct = async (req, res, next) => {
  try {
    const { page, limit, sort, order, search } = req.query;
    const { data: products, pagination } = await adminService.getProductPage({
      page, limit,
      sort: sort || "name",
      order: order || "asc",
      search: search || "",
    });
    res.render("admin/product/view-products", {
      title: "Products - Organic Store",
      admin: true,
      adminData: req.session.admin,
      products,
      pagination,
      searchValue: search || "",
    });
  } catch (error) {
    next(error);
  }
};

const renderAdminAddProduct = async (req, res, next) => {
  try {
    const categories = await adminService.getAllCategories();
    res.render("admin/product/add-products", {
      title: "Add Product - Organic Store",
      admin: true,
      adminData: req.session.admin,
      category: categories,
      metrics:Array.from(Object.values(productMetrics))
    });
  } catch (error) {
    next(error);
  }
};

const postAdminAddProduct = async (req, res, next) => {
  try {
    const files = req.files || [];
    const imgPaths = files.map((f) => f.filename);
    await adminService.addProduct(req.body, imgPaths);
    res.status(201).json({message:'Product added to inventory'})
  } catch (error) {
    next(error);
  }
};

const renderAdminEditProduct = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return renderNotFound(res, "product");
    }
    const product = await adminService.getProductById(req.params.id);
    const categories = await adminService.getAllCategories();
    res.render("admin/product/edit-product", {
      title: "Edit Product - Organic Store",
      admin: true,
      adminData: req.session.admin,
      product,
      category: categories,
      metrics: Array.from(Object.values(productMetrics)),
      isOnlyImage: product.img_path.length === 1,
    });
  } catch (error) {
    if (error.name === "NotFoundError") return renderNotFound(res, "product");
    next(error);
  }
};

const postAdminEditProduct = async (req, res, next) => {
  try {
    const files = req.files || [];
    const imgPaths = files.map((f) => f.filename);
    await adminService.updateProduct(req.params.id, req.body, imgPaths);
    res.status(200).json({message:'Inventory updated successfully'});
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await adminService.softDeleteProduct(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const deleteProductImage = async (req, res, next) => {
  try {
    const { productId, imageId } = req.body;
    const result = await adminService.removeProductImage(productId, imageId);
    if (!result) return res.status(409).json({ status: false, message: "Cannot delete the last image." });
    res.json({ status: result });
  } catch (error) {
    next(error);
  }
};

/* ---- Users ---- */
const renderAdminViewUsers = async (req, res, next) => {
  try {
    const { page, limit, sort, order, search } = req.query;
    const { data: users, pagination } = await adminService.getUserPage({
      page, limit,
      sort: sort || "createdAt",
      order: order || "desc",
      search: search || "",
    });
    res.render("admin/user/view-users", {
      title: "Users - Organic Store",
      admin: true,
      adminData: req.session.admin,
      users,
      pagination,
      searchValue: search || "",
    });
  } catch (error) {
    next(error);
  }
};

const renderAdminAddUser = async (req, res, next) => {
  try {
    res.render("admin/user/add-users", {
      title: "Add User - Organic Store",
      admin: true,
      adminData: req.session.admin,
    });
  } catch (error) {
    next(error);
  }
};

const postAdminAddUser = async (req, res, next) => {
  try {
    await adminService.addUser(req.body);
    res.redirect("/admin/user/view-users");
  } catch (error) {
    next(error);
  }
};

const renderAdminEditUser = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return renderNotFound(res, "user");
    }
    const user = await adminService.getUserById(req.params.id);
    res.render("admin/user/edit-user", {
      title: "Edit User - Organic Store",
      admin: true,
      adminData: req.session.admin,
      userData: user,
    });
  } catch (error) {
    if (error.name === "NotFoundError") return renderNotFound(res, "user");
    next(error);
  }
};

const postAdminEditUser = async (req, res, next) => {
  try {
    await adminService.updateUser(req.params.id, req.body);
    res.redirect("/admin/view-users");
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await adminService.softDeleteUser(req.params.id);
    res.json({ deleted: true });
  } catch (error) {
    if (error.message === "Cannot delete an admin user") {
      return res.status(403).json({ deleted: false, message: error.message });
    }
    next(error);
  }
};

/* ---- Categories ---- */
const renderViewCategory = async (req, res, next) => {
  try {
    const { page, limit, sort, order, search } = req.query;
    const options = {
      parentOnly: true,
      page,
      limit,
      sort: sort || "name",
      order: order || "asc",
      search: search || "",
    };
    const { data: categories, pagination: catPagination } =
      await adminService.getCategoryPage(options);

    const subCategories = await adminService.getAllCategories();

    res.render("admin/category/view-category", {
      title: "Categories - Organic Store",
      admin: true,
      adminData: req.session.admin,
      categories,
      subCategories: subCategories.filter((c) => c.isSubCategory),
      pagination: catPagination,
      searchValue: search || "",
    });
  } catch (error) {
    next(error);
  }
};

const renderAddCategory = async (req, res, next) => {
  try {
    const parentCategories = await adminService.getParentCategories();
    res.render("admin/category/add-category", {
      title: "Add Category - Organic Store",
      admin: true,
      adminData: req.session.admin,
      parentCategories,
      hasParentCategories: parentCategories.length > 0,
    });
  } catch (error) {
    next(error);
  }
};

const postAddCategory = async (req, res, next) => {
  try {
    const file = req.file;
    const imgPath = file ? file.filename : null;
    await adminService.addCategory(req.body, imgPath);
    res.status(201).json({ message: "Category added" });
  } catch (error) {
    if (error.message === "Category name already exists") {
      req.flash("error", error.message);
      return res.redirect("/admin/add-category");
    }
    next(error);
  }
};

const renderEditCategory = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return renderNotFound(res, "category");
    }
    const categoryData = await adminService.getCategoryById(req.params.id);
    const parentCategories = await adminService.getParentCategories(req.params.id);
    res.render("admin/category/edit-category", {
      title: "Edit Category - Organic Store",
      admin: true,
      adminData: req.session.admin,
      categoryData,
      parentCategories,
      hasParentCategories: parentCategories.length > 0,
    });
  } catch (error) {
    if (error.name === "NotFoundError") return renderNotFound(res, "category");
    next(error);
  }
};

const postEditCategory = async (req, res, next) => {
  try {
    const file = req.file;
    await adminService.updateCategory(req.params.id, req.body);
    if (file) {
      await adminService.updateCategoryImage(req.params.id, file.filename);
    }
    req.flash("success", "Category updated");
    res.redirect("/admin/view-category");
  } catch (error) {
    if (error.message === "Category name already exists") {
      req.flash("error", error.message);
      return res.redirect("/admin/edit-category/" + req.params.id);
    }
    if (error.name === "NotFoundError") return renderNotFound(res, "category");
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    await adminService.softDeleteCategory(req.params.id);
    res.json({ success: true });
  } catch (error) {
    if (error.message === "Cannot delete category with active products" || error.message === "Cannot delete category with sub-categories") {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/* ---- Category Offers ---- */
const renderViewCategoryOffer = async (req, res, next) => {
  try {
    const categories = await adminService.getAllCategories();
    const enriched = categories.map((c) => {
      const activeOffer = (c.offers || []).find(
        (o) => o.isActive && !o.isDeleted,
      );
      return { ...c, offerstatus: !!activeOffer, offer: activeOffer || null };
    });
    res.render("admin/offers/view-category-offer", {
      title: "Category Offers - Organic Store",
      admin: true,
      adminData: req.session.admin,
      category: enriched,
    });
  } catch (error) {
    next(error);
  }
};

const renderAddCatOffer = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return renderNotFound(res, "category");
    }
    const categ = await adminService.getCategoryById(req.params.id);
    res.render("admin/offers/add-cat-offer", {
      title: "Add Category Offer - Organic Store",
      admin: true,
      adminData: req.session.admin,
      categ,
    });
  } catch (error) {
    if (error.name === "NotFoundError") return renderNotFound(res, "category");
    next(error);
  }
};

const postAddCatOffer = async (req, res, next) => {
  try {
    await adminService.addCatOffer(req.body);
    res.redirect("/admin/view-category-offer");
  } catch (error) {
    next(error);
  }
};

const removeCatOffer = async (req, res, next) => {
  try {
    await adminService.removeCatOffer(req.params.id);
    res.json({ status: true });
  } catch (error) {
    res.json({ status: false });
  }
};

/* ---- Orders ---- */
const renderViewOrders = async (req, res, next) => {
  try {
    const { page, limit, sort, order, search } = req.query;
    const { data: orders, pagination } = await adminService.getOrderPage({
      page, limit,
      sort: sort || "createdAt",
      order: order || "desc",
      search: search || "",
    });
    res.render("admin/order/view-orders", {
      title: "Orders - Organic Store",
      admin: true,
      adminData: req.session.admin,
      orders,
      pagination,
      searchValue: search || "",
    });
  } catch (error) {
    next(error);
  }
};

const renderEditOrder = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return renderNotFound(res, "order");
    }
    const orderDetail = await adminService.getOrderDetails(req.params.id);
    res.render("admin/order/edit-order", {
      title: "Edit Order - Organic Store",
      admin: true,
      adminData: req.session.admin,
      orderDetail,
    });
  } catch (error) {
    if (error.name === "NotFoundError") return renderNotFound(res, "order");
    next(error);
  }
};

const postUpdateOrder = async (req, res, next) => {
  try {
    if (req.body.dispatched === "true") {
      await adminService.dispatchOrder(req.body.orderId);
    }
    res.redirect("/admin/view-orders");
  } catch (error) {
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    await adminService.deleteOrder(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/* ---- Coupons ---- */
const renderCoupons = async (req, res, next) => {
  try {
    const coup = await adminService.getCoupons();
    res.render("admin/coupons/view-coupon", {
      title: "Coupons - Organic Store",
      admin: true,
      adminData: req.session.admin,
      coup: coup || null,
    });
  } catch (error) {
    next(error);
  }
};

const renderAddCoupon = async (req, res, next) => {
  try {
    res.render("admin/coupons/add-coupons", {
      title: "Add Coupon - Organic Store",
      admin: true,
      adminData: req.session.admin,
    });
  } catch (error) {
    next(error);
  }
};

const postAddCoupon = async (req, res, next) => {
  try {
    await adminService.addCoupon(req.body);
    res.redirect("/admin/coupons");
  } catch (error) {
    next(error);
  }
};

const removeCoupon = async (req, res, next) => {
  try {
    await adminService.removeCoupon(req.params.id);
    res.json({ status: true });
  } catch (error) {
    next(error);
  }
};

/* ---- Banners ---- */
const renderBanners = async (req, res, next) => {
  try {
    const { page, limit, sort, order } = req.query;
    const { data: banners, pagination } = await adminService.getBannerPage({
      page, limit,
      sort: sort || "createdAt",
      order: order || "desc",
    });
    res.render("admin/banner/view-banner", {
      title: "Banners - Organic Store",
      admin: true,
      adminData: req.session.admin,
      banners,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

const renderAddBanner = async (req, res, next) => {
  try {
    res.render("admin/banner/add-banner", {
      title: "Add Banner - Organic Store",
      admin: true,
      adminData: req.session.admin,
    });
  } catch (error) {
    next(error);
  }
};

const postAddBanner = async (req, res, next) => {
  try {
    if (req.file) {
      await adminService.addBanner(req.file.filename);
    }
    res.redirect("/admin/banner");
  } catch (error) {
    next(error);
  }
};

const deleteBanner = async (req, res, next) => {
  try {
    await adminService.deleteBanner(req.params.id);
    res.json({ status: true });
  } catch (error) {
    next(error);
  }
};

/* ---- Product Offers ---- */
const renderProductOffers = async (req, res, next) => {
  try {
    const products = await adminService.getProductInfoOffer();
    res.render("admin/offers/view-product-offers", {
      title: "Product Offers - Organic Store",
      admin: true,
      adminData: req.session.admin,
      products,
    });
  } catch (error) {
    next(error);
  }
};

const renderAddOffer = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return renderNotFound(res, "product");
    }
    const product = await adminService.getProductById(req.params.id);
    res.render("admin/offers/add-offer", {
      title: "Add Offer - Organic Store",
      admin: true,
      adminData: req.session.admin,
      product,
    });
  } catch (error) {
    if (error.name === "NotFoundError") return renderNotFound(res, "product");
    next(error);
  }
};

const postAddOffer = async (req, res, next) => {
  try {
    await adminService.addProductOffer(req.body);
    res.redirect("/admin/product-offers");
  } catch (error) {
    next(error);
  }
};

const removeOffer = async (req, res, next) => {
  try {
    await adminService.removeProductOffer(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/* ---- Feedback & Messages ---- */
const renderFeedback = async (req, res, next) => {
  try {
    const feedbackService = require("../services/feedback.service");
    const result = await feedbackService.getFeedbackPage(req.query);
    res.render("admin/view-feedback", {
      title: "Feedback - Organic Store",
      admin: true,
      adminData: req.session.admin,
      data: result.data,
      pagination: result.pagination,
      searchValue: result.search || "",
    });
  } catch (error) {
    next(error);
  }
};

const updateFeedbackStatus = async (req, res, next) => {
  try {
    const feedbackService = require("../services/feedback.service");
    const { status, adminNote } = req.body;
    const feedback = await feedbackService.updateFeedbackStatus(req.params.id, status || "reviewed", adminNote);
    if (!feedback) return res.status(404).json({ status: false, message: "Feedback not found" });
    res.json({ status: true, feedback });
  } catch (error) {
    next(error);
  }
};

const deleteFeedback = async (req, res, next) => {
  try {
    const feedbackService = require("../services/feedback.service");
    await feedbackService.deleteFeedback(req.params.id);
    res.json({ status: true, message: "Feedback deleted" });
  } catch (error) {
    next(error);
  }
};

const renderMessages = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { data, pagination } = await adminService.getMessagePage({ page, limit });
    res.render("admin/view-message", {
      title: "Messages - Organic Store",
      admin: true,
      adminData: req.session.admin,
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

/* ---- Reports ---- */
const renderReports = async (req, res, next) => {
  try {
    res.render("admin/reports", {
      title: "Reports - Organic Store",
      admin: true,
      adminData: req.session.admin,
    });
  } catch (error) {
    next(error);
  }
};

const getLineData = async (req, res, next) => {
  try {
    const data = await adminService.getMonthSales();
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

const renderViewReports = async (req, res, next) => {
  try {
    res.render("admin/view-reports", {
      title: "View Reports - Organic Store",
      admin: true,
      adminData: req.session.admin,
    });
  } catch (error) {
    next(error);
  }
};

const renderOfferControl = async (req, res, next) => {
  try {
    res.render("admin/offers/offer-control", {
      title: "Offers - Organic Store",
      admin: true,
      adminData: req.session.admin,
    });
  } catch (error) {
    next(error);
  }
};

/* ---- Reviews ---- */
const reviewService = require("../services/review.service");

const renderAdminReviews = async (req, res, next) => {
  try {
    const result = await reviewService.getAllProductsWithReviewStats(req.query);
    res.render("admin/reviews/view-reviews", {
      title: "Product Reviews - Organic Store",
      admin: true,
      adminData: req.session.admin,
      products: result.data,
      pagination: {
        ...result.pagination,
        start: (result.pagination.page - 1) * result.pagination.limit + 1,
        end: Math.min(result.pagination.page * result.pagination.limit, result.pagination.total),
      },
      searchValue: result.search || "",
    });
  } catch (error) {
    next(error);
  }
};

const renderAdminProductReviews = async (req, res, next) => {
  try {
    const Product = require("../collections/product.collection");
    const product = await Product.findById(req.params.productId).select("name images price").lean();
    if (!product) return renderNotFound(res, "product");

    const result = await reviewService.getProductReviewsPaginated(req.params.productId, req.query);
    res.render("admin/reviews/product-reviews", {
      title: `Reviews: ${product.name} - Organic Store`,
      admin: true,
      adminData: req.session.admin,
      product,
      reviews: result.data,
      pagination: {
        ...result.pagination,
        start: (result.pagination.page - 1) * result.pagination.limit + 1,
        end: Math.min(result.pagination.page * result.pagination.limit, result.pagination.total),
        sort: result.sort,
        order: result.order,
      },
      searchValue: result.search || "",
    });
  } catch (error) {
    next(error);
  }
};

const postToggleReviewApproval = async (req, res, next) => {
  try {
    const review = await reviewService.toggleReviewApproval(req.params.id);
    res.json({ status: true, isApproved: review.isApproved });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  renderAdminLogin,
  postAdminLogin,
  adminLogout,
  renderAdminHome,
  renderAdminViewProduct,
  renderAdminAddProduct,
  postAdminAddProduct,
  renderAdminEditProduct,
  postAdminEditProduct,
  deleteProduct,
  deleteProductImage,
  renderAdminViewUsers,
  renderAdminAddUser,
  postAdminAddUser,
  renderAdminEditUser,
  postAdminEditUser,
  deleteUser,
  renderViewCategory,
  renderAddCategory,
  postAddCategory,
  renderEditCategory,
  postEditCategory,
  deleteCategory,
  renderViewCategoryOffer,
  renderAddCatOffer,
  postAddCatOffer,
  removeCatOffer,
  renderViewOrders,
  renderEditOrder,
  postUpdateOrder,
  deleteOrder,
  renderCoupons,
  renderAddCoupon,
  postAddCoupon,
  removeCoupon,
  renderBanners,
  renderAddBanner,
  postAddBanner,
  deleteBanner,
  renderProductOffers,
  renderAddOffer,
  postAddOffer,
  removeOffer,
  renderFeedback,
  updateFeedbackStatus,
  deleteFeedback,
  renderMessages,
  renderReports,
  getLineData,
  renderViewReports,
  renderOfferControl,
  renderAdminReviews,
  renderAdminProductReviews,
  postToggleReviewApproval,
};
