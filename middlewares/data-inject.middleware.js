const Category = require("../collections/category.collection");
const Cart = require("../collections/cart.collection");
const Wallet = require("../collections/wallet.collection");
const Wishlist = require("../collections/wishlist.collection");

const dataInjectMiddleware = async (req, res, next) => {
  try {
    const categories = await Category.find({ isDeleted: false, isActive: true })
      .select("name _id")
      .lean();
    res.locals.categories = categories;
    res.locals.sessionUser = req.session.user;
    res.locals.user = req.user;

    if (req.session.userId) {
      const userId = req.session.userId;
      const [cart, wallet, wishlist] = await Promise.all([
        Cart.findOne({ userId }).lean(),
        Wallet.findOne({ userId }).lean(),
        Wishlist.findOne({ userId }).lean(),
      ]);
      res.locals.cartCount = cart ? cart.items.length : 0;
      res.locals.walletBalance = wallet ? wallet.balance : 0;
      res.locals.wishlistCount = wishlist ? wishlist.products.length : 0;
    } else {
      res.locals.walletBalance = 0;
      res.locals.wishlistCount = 0;
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { dataInjectMiddleware };
