const cartService = require("../services/cart.service");

const applyCoupon = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login first" });

    const { code } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ status: false, message: "Coupon code is required" });

    const result = await cartService.applyCartCoupon(userId, code.trim());
    res.json({ status: true, cart: result });
  } catch (err) {
    if (err.name === "NotFoundError") return res.status(404).json({ status: false, message: err.message });
    if (err.name === "ValidationError") return res.status(400).json({ status: false, message: err.message });
    next(err);
  }
};

const removeCoupon = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login first" });

    const result = await cartService.removeCartCoupon(userId);
    res.json({ status: true, cart: result });
  } catch (err) {
    if (err.name === "NotFoundError") return res.status(404).json({ status: false, message: err.message });
    next(err);
  }
};

const addCartItem = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ status: false, message: "Please login first" });
    }

    const { productId, unitIndex, quantity } = req.body;
    if (!productId) {
      return res.status(400).json({ status: false, message: "productId is required" });
    }

    const qty = parseInt(quantity) || 1;
    const idx = unitIndex !== undefined ? parseInt(unitIndex) : undefined;

    const result = await cartService.addCartItem(userId, productId, idx, qty);
    res.status(201).json({ status: true, cart: result });
  } catch (err) {
    if (err.name === "NotFoundError") {
      return res.status(404).json({ status: false, message: err.message });
    }
    next(err);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ status: false, message: "Please login first" });
    }

    const { itemId } = req.params;
    const { quantity, unitIndex } = req.body;

    if (unitIndex !== undefined) {
      const result = await cartService.updateCartItemUnit(userId, itemId, parseInt(unitIndex));
      return res.json({ status: true, cart: result });
    }

    if (!quantity || parseInt(quantity) < 1) {
      return res.status(400).json({ status: false, message: "quantity must be at least 1" });
    }

    const result = await cartService.updateCartItemQuantity(userId, itemId, parseInt(quantity));
    res.json({ status: true, cart: result });
  } catch (err) {
    if (err.name === "NotFoundError") {
      return res.status(404).json({ status: false, message: err.message });
    }
    next(err);
  }
};

const deleteCartItem = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ status: false, message: "Please login first" });
    }

    const { itemId } = req.params;
    const result = await cartService.removeCartItem(userId, itemId);
    res.json({ status: true, cart: result });
  } catch (err) {
    if (err.name === "NotFoundError") {
      return res.status(404).json({ status: false, message: err.message });
    }
    next(err);
  }
};

const getCartPage = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect("/v1/auth/login");
    }

    const result = await cartService.getCart(userId);

    if (!result.items.length) {
      return res.render("cart/cart-empty", {
        title: "Cart is Empty",
        user: req.user,
        sessionUser: req.session.user,
      });
    }

    res.render("cart/userCart", {
      title: "Shopping Cart",
      user: req.user,
      sessionUser: req.session.user,
      products: result.items,
      total: result.totals.finalAmount,
      totals: result.totals,
      cartCount: result.items.length,
      appliedCoupon: result.appliedCoupon,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { addCartItem, updateCartItem, deleteCartItem, getCartPage, applyCoupon, removeCoupon };
