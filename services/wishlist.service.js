const Wishlist = require("../collections/wishlist.collection");
const Product = require("../collections/product.collection");
const { NotFoundError } = require("../shared/utils/error.util");

const getWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ userId })
    .populate("products")
    .lean();

  if (!wishlist) {
    wishlist = { userId, products: [] };
  }

  const { enrichProductsWithOffers } = require("./pricing.service");
  const enriched = await enrichProductsWithOffers(
    wishlist.products.filter(Boolean),
  );

  return { ...wishlist, products: enriched };
};

const toggleWishlistItem = async (userId, productId) => {
  const product = await Product.findById(productId);
  if (!product) throw new NotFoundError("Product not found");

  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, products: [productId] });
    return { added: true, wishlist };
  }

  const idx = wishlist.products.findIndex(
    (p) => p.toString() === productId,
  );

  if (idx === -1) {
    wishlist.products.push(productId);
    await wishlist.save();
    return { added: true, wishlist };
  } else {
    wishlist.products.splice(idx, 1);
    await wishlist.save();
    return { added: false, wishlist };
  }
};

const isInWishlist = async (userId, productId) => {
  if (!userId) return false;
  const wishlist = await Wishlist.findOne({ userId }).lean();
  if (!wishlist) return false;
  return wishlist.products.some((p) => p.toString() === productId);
};

const getWishlistCount = async (userId) => {
  if (!userId) return 0;
  const wishlist = await Wishlist.findOne({ userId }).lean();
  return wishlist ? wishlist.products.length : 0;
};

const getWishlistProductIds = async (userId) => {
  if (!userId) return [];
  const wishlist = await Wishlist.findOne({ userId }).lean();
  return wishlist ? wishlist.products.map((p) => p.toString()) : [];
};

module.exports = {
  getWishlist,
  toggleWishlistItem,
  isInWishlist,
  getWishlistCount,
  getWishlistProductIds,
};
