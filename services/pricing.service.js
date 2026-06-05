const mongoose = require("mongoose");
const Product = require("../collections/product.collection");
const Category = require("../collections/category.collection");
const Offer = require("../collections/offer.collection");

const checkoutCouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, index: true },
  type: { type: String, enum: ["percentage", "fixed"], required: true },
  value: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0, min: 0 },
  maxDiscount: { type: Number, default: null, min: 0 },
  usageLimit: { type: Number, default: null, min: 1 },
  perUserLimit: { type: Number, default: null, min: 1 },
  usageCount: { type: Number, default: 0, min: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const couponUsageSchema = new mongoose.Schema({
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: "CheckoutCoupon", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  usedAt: { type: Date, default: Date.now },
}, { timestamps: true });

couponUsageSchema.index({ couponId: 1, userId: 1 });

const Coupon = mongoose.models.CheckoutCoupon || mongoose.model("CheckoutCoupon", checkoutCouponSchema, "checkout_coupon");
const CouponUsage = mongoose.models.CheckoutCouponUsage || mongoose.model("CheckoutCouponUsage", couponUsageSchema, "checkout_coupon_usage");

const resolveBestOffer = async (productId, categoryId) => {
  const now = new Date();

  const product = await Product.findById(productId).populate("offers").lean();
  if (!product) return null;

  const category = await Category.findById(categoryId).populate("offers").lean();
  if (!category) return null;

  const candidates = [];

  if (product.offers && product.offers.length) {
    for (const o of product.offers) {
      if (o.appliedTo === "product" && matchesDate(o, now)) {
        candidates.push(o);
      }
    }
  }

  if (category.offers && category.offers.length) {
    if (category.isSubCategory) {
      for (const o of category.offers) {
        if (o.appliedTo === "subcategory" && matchesDate(o, now)) {
          candidates.push(o);
        }
      }
      if (category.parentCategory) {
        const parentCat = await Category.findById(category.parentCategory).populate("offers").lean();
        if (parentCat && parentCat.offers) {
          for (const o of parentCat.offers) {
            if (o.appliedTo === "category" && matchesDate(o, now)) {
              candidates.push(o);
            }
          }
        }
      }
    } else {
      for (const o of category.offers) {
        if (o.appliedTo === "category" && matchesDate(o, now)) {
          candidates.push(o);
        }
      }
    }
  }

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const pri = (b.priority || 0) - (a.priority || 0);
    if (pri !== 0) return pri;
    return b.value - a.value;
  });

  return candidates[0];
};

const matchesDate = (offer, now) => {
  return (
    offer.isActive &&
    !offer.isDeleted &&
    new Date(offer.startDate) <= now &&
    new Date(offer.endDate) >= now
  );
};

const applyOffer = (unitPrice, offer) => {
  if (!offer) {
    return { discount: 0, finalPrice: unitPrice };
  }
  let discount = 0;
  if (offer.type === "percentage") {
    discount = Math.round((unitPrice * offer.value) / 100 * 100) / 100;
  } else if (offer.type === "fixed") {
    discount = Math.min(offer.value, unitPrice);
  }
  const finalPrice = Math.max(0, unitPrice - discount);
  return { discount, finalPrice };
};

const resolveBestOfferInMemory = (product, category, now) => {
  if (!product || !category) return null;
  const candidates = [];

  if (product.offers && product.offers.length) {
    for (const o of product.offers) {
      if (o.appliedTo === "product" && matchesDate(o, now)) {
        candidates.push(o);
      }
    }
  }

  if (category.offers && category.offers.length) {
    if (category.isSubCategory && category.parentCategory) {
      for (const o of category.offers) {
        if (o.appliedTo === "subcategory" && matchesDate(o, now)) {
          candidates.push(o);
        }
      }
      if (category.parentCategoryOffers) {
        for (const o of category.parentCategoryOffers) {
          if (o.appliedTo === "category" && matchesDate(o, now)) {
            candidates.push(o);
          }
        }
      }
    } else {
      for (const o of category.offers) {
        if (o.appliedTo === "category" && matchesDate(o, now)) {
          candidates.push(o);
        }
      }
    }
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const pri = (b.priority || 0) - (a.priority || 0);
    if (pri !== 0) return pri;
    return b.value - a.value;
  });
  return candidates[0];
};

const enrichProductWithOffer = (product, categoriesMap) => {
  if (!product.category) return { ...product, bestOffer: null, finalPrice: product.price };
  const cat = categoriesMap[product.category.toString()];
  if (!cat) return { ...product, bestOffer: null, finalPrice: product.price };
  const now = new Date();
  const bestOffer = resolveBestOfferInMemory(product, cat, now);
  const unitPrice = product.availableUnits?.[0]?.price || product.price;
  const { finalPrice } = applyOffer(unitPrice, bestOffer);
  return { ...product, bestOffer: bestOffer || null, finalPrice };
};

const enrichProductsWithOffers = async (products) => {
  if (!products || !products.length) return products;
  const catIds = [...new Set(products.map((p) => p.category?.toString()).filter(Boolean))];
  const categories = await Category.find({ _id: { $in: catIds } }).populate("offers").lean();
  const parentCatIds = categories.filter((c) => c.parentCategory).map((c) => c.parentCategory.toString());
  const parentCategories = parentCatIds.length
    ? await Category.find({ _id: { $in: [...new Set(parentCatIds)] } }).populate("offers").lean()
    : [];
  const parentCatMap = {};
  for (const pc of parentCategories) {
    parentCatMap[pc._id.toString()] = pc.offers || [];
  }
  const catMap = {};
  for (const c of categories) {
    c.parentCategoryOffers = c.parentCategory ? parentCatMap[c.parentCategory.toString()] || [] : [];
    catMap[c._id.toString()] = c;
  }
  return products.map((p) => enrichProductWithOffer(p, catMap));
};

/**
 * Calculate totals from cart items with their offer-applied values.
 * @param {Array} items - Cart items with appliedOffer info
 * @returns {{ subtotal: number, offerDiscount: number, couponDiscount: number, grandTotal: number }}
 */
const calculateCartTotals = (items, couponDiscount = 0) => {
  let subtotal = 0;
  let offerDiscount = 0;

  for (const item of items) {
    const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);
    const itemOfferDiscount = (item.offerDiscount || 0) * (item.quantity || 0);

    subtotal += lineTotal;
    offerDiscount += itemOfferDiscount;
  }

  const afterOffer = subtotal - offerDiscount;
  const couponDiscountAmount = Math.min(couponDiscount || 0, afterOffer);
  const grandTotal = afterOffer - couponDiscountAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    offerDiscount: Math.round(offerDiscount * 100) / 100,
    couponDiscount: Math.round(couponDiscountAmount * 100) / 100,
    grandTotal: Math.max(0, Math.round(grandTotal * 100) / 100),
  };
};

/**
 * Validate and apply a coupon to a given amount.
 * @param {string} couponCode
 * @param {string} userId
 * @param {number} amount - amount after product offers
 * @returns {Promise<{ coupon: object|null, discount: number, error: string|null }>}
 */
const applyCoupon = async (couponCode, userId, amount) => {
  if (!couponCode || !userId) {
    return { coupon: null, discount: 0, error: null };
  }

  const coupon = await Coupon.findOne({
    code: couponCode.toUpperCase(),
    isActive: true,
    isDeleted: false,
  });

  if (!coupon) {
    return { coupon: null, discount: 0, error: "Invalid coupon code" };
  }

  const now = new Date();
  if (coupon.startDate > now || coupon.endDate < now) {
    return { coupon: null, discount: 0, error: "Coupon has expired" };
  }

  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    return { coupon: null, discount: 0, error: "Coupon usage limit reached" };
  }

  if (coupon.perUserLimit != null) {
    const userUsageCount = await CouponUsage.countDocuments({
      couponId: coupon._id,
      userId,
    });
    if (userUsageCount >= coupon.perUserLimit) {
      return { coupon: null, discount: 0, error: "Coupon per-user limit reached" };
    }
  }

  if (amount < coupon.minOrderAmount) {
    return {
      coupon: null,
      discount: 0,
      error: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
    };
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Math.round((amount * coupon.value) / 100 * 100) / 100;
    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = Math.min(coupon.value, amount);
  }

  discount = Math.max(0, discount);
  return { coupon, discount, error: null };
};

module.exports = {
  resolveBestOffer,
  resolveBestOfferInMemory,
  enrichProductsWithOffers,
  applyOffer,
  calculateCartTotals,
  applyCoupon,
};
