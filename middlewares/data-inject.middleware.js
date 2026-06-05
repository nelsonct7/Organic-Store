// Common data middleware: inject categories and user data into all views
const Category = require("../collections/category.collection");
const Cart = require("../collections/cart.collection");

const dataInjectMiddleware = async (req, res, next) => {
  try {
    const categories = await Category.find({ isDeleted: false, isActive: true })
      .select("name _id")
      .lean();
    res.locals.categories = categories;
    res.locals.sessionUser = req.session.user;
    res.locals.user = req.user;

    if (req.session.userId) {
      const cart = await Cart.findOne({ userId: req.session.userId }).lean();
      res.locals.cartCount = cart ? cart.items.length : 0;
    }
    res.locals.walletBalance = 0;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { dataInjectMiddleware };
