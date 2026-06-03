const adminService = require("../services/admin.service");

/* ---- Auth ---- */
const renderAdminLogin = async (req, res, next) => {
  try {
    if (req.session.isAdmin) return res.redirect("/admin/home");
    res.render("admin/admin-login", {
      title: "Admin Login - Organic Store",
      admin: true,
      adminLogin: true,
      logErr: req.session.err || false,
    });
    req.session.err = false;
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
    req.session.err = true;
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
    const products = await adminService.getAllProducts();
    res.render("admin/view-products", {
      title: "Products - Organic Store",
      admin: true,
      adminData: req.session.admin,
      products,
    });
  } catch (error) {
    next(error);
  }
};

const renderAdminAddProduct = async (req, res, next) => {
  try {
    const categories = await adminService.getAllCategories();
    res.render("admin/add-products", {
      title: "Add Product - Organic Store",
      admin: true,
      adminData: req.session.admin,
      category: categories,
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
    res.redirect("/admin/view-products");
  } catch (error) {
    next(error);
  }
};

const renderAdminEditProduct = async (req, res, next) => {
  try {
    const product = await adminService.getProductById(req.params.id);
    const categories = await adminService.getAllCategories();
    res.render("admin/edit-product", {
      title: "Edit Product - Organic Store",
      admin: true,
      adminData: req.session.admin,
      product,
      category: categories,
    });
  } catch (error) {
    next(error);
  }
};

const postAdminEditProduct = async (req, res, next) => {
  try {
    const files = req.files || [];
    const imgPaths = files.map((f) => f.filename);
    await adminService.updateProduct(req.params.id, req.body, imgPaths);
    res.redirect("/admin/view-products");
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
    const { productId, imageIndex } = req.body;
    const result = await adminService.removeProductImage(productId, imageIndex);
    res.json({ status: result });
  } catch (error) {
    next(error);
  }
};

/* ---- Users ---- */
const renderAdminViewUsers = async (req, res, next) => {
  try {
    const users = await adminService.getAllUsers();
    res.render("admin/view-users", {
      title: "Users - Organic Store",
      admin: true,
      adminData: req.session.admin,
      users,
    });
  } catch (error) {
    next(error);
  }
};

const renderAdminAddUser = async (req, res, next) => {
  try {
    res.render("admin/add-users", {
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
    res.redirect("/admin/view-users");
  } catch (error) {
    next(error);
  }
};

const renderAdminEditUser = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    res.render("admin/edit-user", {
      title: "Edit User - Organic Store",
      admin: true,
      adminData: req.session.admin,
      userData: user,
    });
  } catch (error) {
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
    next(error);
  }
};

/* ---- Categories ---- */
const renderViewCategory = async (req, res, next) => {
  try {
    const categories = await adminService.getAllCategories();
    res.render("admin/view-category", {
      title: "Categories - Organic Store",
      admin: true,
      adminData: req.session.admin,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

const renderAddCategory = async (req, res, next) => {
  try {
    res.render("admin/add-category", {
      title: "Add Category - Organic Store",
      admin: true,
      adminData: req.session.admin,
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
    res.redirect("/admin/view-category");
  } catch (error) {
    next(error);
  }
};

const renderEditCategory = async (req, res, next) => {
  try {
    const categoryData = await adminService.getCategoryById(req.params.id);
    res.render("admin/edit-category", {
      title: "Edit Category - Organic Store",
      admin: true,
      adminData: req.session.admin,
      categoryData,
    });
  } catch (error) {
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
    res.redirect("/admin/view-category");
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    await adminService.softDeleteCategory(req.query.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/* ---- Category Offers ---- */
const renderViewCategoryOffer = async (req, res, next) => {
  try {
    const categories = await adminService.getAllCategories();
    res.render("admin/view-category-offer", {
      title: "Category Offers - Organic Store",
      admin: true,
      adminData: req.session.admin,
      category: categories,
    });
  } catch (error) {
    next(error);
  }
};

const renderAddCatOffer = async (req, res, next) => {
  try {
    const categ = await adminService.getCategoryById(req.params.id);
    res.render("admin/add-cat-offer", {
      title: "Add Category Offer - Organic Store",
      admin: true,
      adminData: req.session.admin,
      categ,
    });
  } catch (error) {
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
    const orders = await adminService.getAllOrders();
    res.render("admin/view-orders", {
      title: "Orders - Organic Store",
      admin: true,
      adminData: req.session.admin,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

const renderEditOrder = async (req, res, next) => {
  try {
    const orderDetail = await adminService.getOrderDetails(req.params.id);
    res.render("admin/edit-order", {
      title: "Edit Order - Organic Store",
      admin: true,
      adminData: req.session.admin,
      orderDetail,
    });
  } catch (error) {
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
    res.render("admin/view-coupon", {
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
    res.render("admin/add-coupons", {
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
    const banners = await adminService.getBanners();
    res.render("admin/view-banner", {
      title: "Banners - Organic Store",
      admin: true,
      adminData: req.session.admin,
      banners,
    });
  } catch (error) {
    next(error);
  }
};

const renderAddBanner = async (req, res, next) => {
  try {
    res.render("admin/add-banner", {
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
    res.render("admin/view-product-offers", {
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
    const product = await adminService.getProductById(req.params.id);
    res.render("admin/add-offer", {
      title: "Add Offer - Organic Store",
      admin: true,
      adminData: req.session.admin,
      product,
    });
  } catch (error) {
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
    res.redirect("/admin/product-offers");
  } catch (error) {
    next(error);
  }
};

/* ---- Feedback & Messages ---- */
const renderFeedback = async (req, res, next) => {
  try {
    const data = await adminService.getFeedback();
    res.render("admin/view-feedback", {
      title: "Feedback - Organic Store",
      admin: true,
      adminData: req.session.admin,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const renderMessages = async (req, res, next) => {
  try {
    const data = await adminService.getMessages();
    res.render("admin/view-message", {
      title: "Messages - Organic Store",
      admin: true,
      adminData: req.session.admin,
      data,
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
    res.render("admin/offer-control", {
      title: "Offers - Organic Store",
      admin: true,
      adminData: req.session.admin,
    });
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
  renderMessages,
  renderReports,
  getLineData,
  renderViewReports,
  renderOfferControl,
};
