const Category = require("../collections/category.collection");
const Product = require("../collections/product.collection");
const Banner = require("../collections/banner.collection");

const renderHomePage = async (req, res, next) => {
  try {
    const categories = await Category.find({ isDeleted: false, isActive: true }).lean();
    const products = await Product.find({ isDeleted: false, isActive: true, status: "available" })
      .limit(10)
      .lean();
    const banners = await Banner.find({ isDeleted: false, isActive: true }).lean();

    res.render("base/index", {
      title: "Welcome to Organic Store",
      user: req.user,
      sessionUser: req.session.user,
      categories,
      products,
      banners,
    });
  } catch (err) {
    next(err);
  }
};
const renderAboutUsPage = (req, res) => {
  res.render("base/about-us", {
    title: "About Us - Organic Store",
    user: req.user,
    sessionUser: req.session.user,
  });
};
const renderTermsPage = (req, res) => {
  res.render("base/terms-of-service", {
    title: "Terms of Service - Organic Store",
    user: req.user,
    sessionUser: req.session.user,
  });
};
const renderCareersPage = (req, res) => {
  res.render("base/careers", {
    title: "Careers - Organic Store",
    user: req.user,
    sessionUser: req.session.user,
  });
};
const renderPrivacyPage = (req, res) => {
  res.render("base/privacy-policy", {
    title: "Privacy Policy - Organic Store",
    user: req.user,
    sessionUser: req.session.user,
  });
};

const renderCategoryProducts = async (req, res, next) => {
  try {
    const catId = req.params.id;
    const category = await Category.findById(catId).lean();
    if (!category) return res.redirect("/");

    const products = await Product.find({
      category: catId,
      isDeleted: false,
      isActive: true,
      status: "available",
    })
      .limit(10)
      .lean();

    const totalProducts = await Product.countDocuments({
      category: catId,
      isDeleted: false,
      isActive: true,
      status: "available",
    });

    res.render("base/category-products", {
      title: category.name,
      user: req.user,
      sessionUser: req.session.user,
      categories: await Category.find({ isDeleted: false, isActive: true }).lean(),
      category,
      products,
      hasMore: totalProducts > 10,
    });
  } catch (err) {
    next(err);
  }
};

const searchProducts = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);

    const products = await Product.find({
      isDeleted: false,
      isActive: true,
      status: "available",
      name: { $regex: q, $options: "i" },
    })
      .limit(8)
      .select("name price images slug")
      .lean();

    res.json(products);
  } catch (err) {
    next(err);
  }
};

const renderViewProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.redirect("/");

    res.render("products/view-products", {
      title: product.name,
      user: req.user,
      sessionUser: req.session.user,
      product,
    });
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.json({ status: false, message: "Please login first" });

    const productId = req.params.id;
    const product = await Product.findById(productId).select("price").lean();
    if (!product) return res.json({ status: false });

    const CartItem = require("../collections/cart-item.collection");
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    const existingItem = await CartItem.findOne({ cartId: cart._id, productId }).lean();
    if (existingItem) {
      await CartItem.findByIdAndUpdate(existingItem._id, { $inc: { quantity: 1 } });
    } else {
      const newItem = await CartItem.create({
        productId,
        cartId: cart._id,
        quantity: 1,
        price: product.price,
        offPrice: product.price,
      });
      cart.items.push({ cartItemId: newItem._id });
      await cart.save();
    }
    res.json({ status: true });
  } catch (err) {
    res.json({ status: false });
  }
};

const renderOrders = async (req, res, next) => {
  try {
    if (!req.session.userId) return res.redirect("/v1/auth/login");

    const Order = require("../collections/order.collection");
    const orders = await Order.find({ userId: req.session.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.render("base/orders", {
      title: "My Orders",
      user: req.user,
      sessionUser: req.session.user,
      orders,
    });
  } catch (err) {
    next(err);
  }
};

const renderProfile = async (req, res, next) => {
  try {
    if (!req.session.userId) return res.redirect("/v1/auth/login");

    const UserModel = require("../collections/user.collection");
    const userData = await UserModel.findById(req.session.userId).lean();

    res.render("base/profile", {
      title: "My Account",
      user: req.user,
      sessionUser: req.session.user,
      userData,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  renderHomePage,
  renderAboutUsPage,
  renderCareersPage,
  renderTermsPage,
  renderPrivacyPage,
  renderCategoryProducts,
  searchProducts,
  renderViewProduct,
  addToCart,
  renderOrders,
  renderProfile,
};
