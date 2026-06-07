const Category = require("../collections/category.collection");
const Product = require("../collections/product.collection");
const Banner = require("../collections/banner.collection");
const Wishlist = require("../collections/wishlist.collection");
const { paginate } = require("../shared/utils/pagination.util");

const enrichWithWishlist = async (products, userId) => {
  if (!userId || !products.length) return products;
  const wishlist = await Wishlist.findOne({ userId }).lean();
  if (!wishlist || !wishlist.products.length) return products;
  const wishlistIds = wishlist.products.map((p) => p.toString());
  return products.map((p) => ({
    ...p,
    inWishlist: wishlistIds.includes(p._id.toString()),
  }));
};

const renderHomePage = async (req, res, next) => {
  try {
    const categories = await Category.find({ isDeleted: false, isActive: true }).lean();
    const banners = await Banner.find({ isDeleted: false, isActive: true }).lean();

    const baseQuery = { isDeleted: false, isActive: true, status: "available" };
    const result = await paginate(Product, baseQuery, req.query, ["offers"]);

    const { enrichProductsWithOffers } = require("../services/pricing.service");
    const enrichedProducts = await enrichProductsWithOffers(result.data);
    const products = await enrichWithWishlist(enrichedProducts, req.session.userId);

    res.render("base/index", {
      title: "Welcome to Organic Store",
      user: req.user,
      sessionUser: req.session.user,
      categories,
      products,
      banners,
      pagination: {
        ...result.pagination,
        start: (result.pagination.page - 1) * result.pagination.limit + 1,
        end: Math.min(result.pagination.page * result.pagination.limit, result.pagination.total),
      },
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

    const baseQuery = {
      category: catId,
      isDeleted: false,
      isActive: true,
      status: "available",
    };
    const result = await paginate(Product, baseQuery, req.query, ["offers"]);

    const { enrichProductsWithOffers } = require("../services/pricing.service");
    const enrichedProducts = await enrichProductsWithOffers(result.data);
    const products = await enrichWithWishlist(enrichedProducts, req.session.userId);

    res.render("base/category-products", {
      title: category.name,
      user: req.user,
      sessionUser: req.session.user,
      categories: await Category.find({ isDeleted: false, isActive: true }).lean(),
      category,
      products,
      pagination: {
        ...result.pagination,
        start: (result.pagination.page - 1) * result.pagination.limit + 1,
        end: Math.min(result.pagination.page * result.pagination.limit, result.pagination.total),
      },
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
      .populate("offers")
      .limit(8)
      .select("name price images slug offers category")
      .lean();

    const { enrichProductsWithOffers } = require("../services/pricing.service");
    const enriched = await enrichProductsWithOffers(products);

    const result = enriched.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      images: p.images,
      slug: p.slug,
      finalPrice: p.finalPrice,
      bestOffer: p.bestOffer,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

const renderViewProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate("category").lean();
    if (!product) return res.redirect("/");

    const { resolveBestOffer, applyOffer } = require("../services/pricing.service");
    const bestOffer = await resolveBestOffer(product._id, product.category?._id);
    const { finalPrice } = applyOffer(
      product.availableUnits?.[0]?.price || product.price,
      bestOffer,
    );

    const reviewService = require("../services/review.service");
    const reviews = await reviewService.getProductReviews(product._id);
    const summary = await reviewService.getProductRatingSummary(product._id);
    const userReview = await reviewService.getUserReviewForProduct(req.session.userId, product._id);

    res.render("products/view-products", {
      title: product.name,
      user: req.user,
      sessionUser: req.session.user,
      product,
      actualPrice: finalPrice,
      bestOffer,
      reviews,
      summary,
      userReview,
    });
  } catch (err) {
    next(err);
  }
};

const renderAllProducts = async (req, res, next) => {
  try {
    const baseQuery = { isDeleted: false, isActive: true, status: "available" };
    const result = await paginate(Product, baseQuery, req.query, ["offers"]);

    const { enrichProductsWithOffers } = require("../services/pricing.service");
    const enrichedProducts = await enrichProductsWithOffers(result.data);
    const products = await enrichWithWishlist(enrichedProducts, req.session.userId);

    res.render("base/all-products", {
      title: "All Products - Organic Store",
      user: req.user,
      sessionUser: req.session.user,
      categories: await Category.find({ isDeleted: false, isActive: true }).lean(),
      products,
      pagination: {
        ...result.pagination,
        start: (result.pagination.page - 1) * result.pagination.limit + 1,
        end: Math.min(result.pagination.page * result.pagination.limit, result.pagination.total),
      },
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
    const Cart = require("../collections/cart.collection");
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    const existingItem = await CartItem.findOne({ cartId: cart._id, productId }).lean();
    if (existingItem) {
      await CartItem.findByIdAndUpdate(existingItem._id, {
        $inc: { quantity: 1 },
        finalUnitPrice: product.price,
        subtotal: product.price * (existingItem.quantity + 1),
        price: product.price,
        offPrice: product.price,
      });
    } else {
      const newItem = await CartItem.create({
        productId,
        cartId: cart._id,
        quantity: 1,
        price: product.price,
        offPrice: product.price,
        finalUnitPrice: product.price,
        subtotal: product.price,
        selectedUnit: { label: null, metric: 'grams', measure: 0, price: product.price },
      });
      cart.items.push({ cartItemId: newItem._id });
      await cart.save();
    }
    // Recalculate cart totals
    const { recalculateCart } = require("../services/cart.service");
    await recalculateCart(cart._id);
    res.json({ status: true });
  } catch (err) {
    res.json({ status: false });
  }
};

const renderProfile = async (req, res, next) => {
  try {
    if (!req.session.userId) return res.redirect("/v1/auth/login");

    const UserModel = require("../collections/user.collection");
    const userData = await UserModel.findById(req.session.userId).lean();

    const reviewService = require("../services/review.service");
    const reviews = await reviewService.getUserReviews(req.session.userId);

    const addressService = require("../services/address.service");
    const addresses = await addressService.getUserAddresses(req.session.userId);

    res.render("base/profile", {
      title: "My Account",
      user: req.user,
      sessionUser: req.session.user,
      userData,
      reviews,
      addresses,
    });
  } catch (err) {
    next(err);
  }
};

const updateProfileMobile = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ status: false, message: "Mobile number is required" });

    const normalized = String(mobile).replace(/[^0-9]/g, "");
    if (normalized.length !== 10) return res.status(400).json({ status: false, message: "Invalid mobile number" });

    const UserModel = require("../collections/user.collection");
    const existing = await UserModel.findOne({ mobile: normalized, _id: { $ne: userId } }).lean();
    if (existing) return res.status(409).json({ status: false, message: "Mobile number already in use" });

    await UserModel.findByIdAndUpdate(userId, { $set: { mobile: normalized, isMobileVerified: false } });

    res.json({ status: true, message: "Mobile number updated", mobile: normalized });
  } catch (err) {
    next(err);
  }
};

const addProfileAddress = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const addressService = require("../services/address.service");
    const address = await addressService.addAddress(userId, req.body);

    res.status(201).json({ status: true, message: "Address added", address });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ status: false, message: err.message });
    next(err);
  }
};

const updateProfileAddress = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const addressService = require("../services/address.service");
    const address = await addressService.updateAddress(req.params.id, userId, req.body);

    res.json({ status: true, message: "Address updated", address });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ status: false, message: err.message });
    next(err);
  }
};

const deleteProfileAddress = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const addressService = require("../services/address.service");
    await addressService.deleteAddress(req.params.id, userId);

    res.json({ status: true, message: "Address deleted" });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ status: false, message: err.message });
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
  renderAllProducts,
  searchProducts,
  renderViewProduct,
  addToCart,
  renderProfile,
  updateProfileMobile,
  addProfileAddress,
  updateProfileAddress,
  deleteProfileAddress,
};
