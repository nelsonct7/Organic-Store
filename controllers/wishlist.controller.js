const wishlistService = require("../services/wishlist.service");

const renderWishlist = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/v1/auth/login");

    const wishlist = await wishlistService.getWishlist(userId);

    res.render("base/wishlist", {
      title: "My Wishlist - Organic Store",
      user: req.user,
      sessionUser: req.session.user,
      products: wishlist.products,
      isEmpty: !wishlist.products.length,
    });
  } catch (err) {
    next(err);
  }
};

const toggleItem = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login first" });

    const { id: productId } = req.params;
    const result = await wishlistService.toggleWishlistItem(userId, productId);
    const count = await wishlistService.getWishlistCount(userId);

    res.json({ status: true, added: result.added, count });
  } catch (err) {
    if (err.name === "NotFoundError") return res.status(404).json({ status: false, message: err.message });
    next(err);
  }
};

const checkItem = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { id: productId } = req.params;
    const inWishlist = await wishlistService.isInWishlist(userId, productId);

    res.json({ status: true, inWishlist });
  } catch (err) {
    next(err);
  }
};

module.exports = { renderWishlist, toggleItem, checkItem };
