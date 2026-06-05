const Cart = require("../collections/cart.collection");
const CartItem = require("../collections/cart-item.collection");
const Product = require("../collections/product.collection");
const { NotFoundError } = require("../shared/utils/error.util");
const { resolveBestOffer, applyOffer } = require("./pricing.service");

const addCartItem = async (userId, productId, unitIndex, quantity) => {
  const product = await Product.findById(productId);
  if (!product) throw new NotFoundError("Product not found");

  let selectedUnit;
  if (
    unitIndex !== undefined &&
    product.availableUnits &&
    product.availableUnits[unitIndex]
  ) {
    selectedUnit = { ...product.availableUnits[unitIndex].toObject() };
  } else {
    selectedUnit = { label: null, metric: 'grams', measure: 0, price: product.price };
  }

  const offer = await resolveBestOffer(productId, product.category);
  const { discount, finalPrice } = applyOffer(selectedUnit.price, offer);

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  const existingItem = await CartItem.findOne({
    cartId: cart._id,
    productId,
    "selectedUnit.label": selectedUnit.label,
    "selectedUnit.measure": selectedUnit.measure,
  });

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.finalUnitPrice = finalPrice;
    existingItem.subtotal = finalPrice * existingItem.quantity;
    existingItem.offPrice = finalPrice;
    existingItem.price = selectedUnit.price;
    existingItem.selectedUnit = selectedUnit;
    existingItem.appliedOffer = offer
      ? {
          offerId: offer._id,
          type: offer.type,
          value: offer.value,
          discount,
        }
      : { offerId: null, type: null, value: 0, discount: 0 };
    await existingItem.save();
  } else {
    const newItem = await CartItem.create({
      productId,
      cartId: cart._id,
      selectedUnit,
      quantity,
      price: selectedUnit.price,
      offPrice: finalPrice,
      finalUnitPrice: finalPrice,
      subtotal: finalPrice * quantity,
      appliedOffer: offer
        ? {
            offerId: offer._id,
            type: offer.type,
            value: offer.value,
            discount,
          }
        : { offerId: null, type: null, value: 0, discount: 0 },
    });
    cart.items.push({ cartItemId: newItem._id });
    await cart.save();
  }

  await recalculateCart(cart._id);
  return getCart(userId);
};

const updateCartItemQuantity = async (userId, itemId, quantity) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new NotFoundError("Cart not found");

  const item = await CartItem.findOne({ _id: itemId, cartId: cart._id });
  if (!item) throw new NotFoundError("Cart item not found");

  if (quantity < 1) {
    await removeCartItem(userId, itemId);
    return getCart(userId);
  }

  const product = await Product.findById(item.productId);
  if (product) {
    const offer = item.appliedOffer?.offerId
      ? await resolveBestOffer(item.productId, product.category)
      : null;
    const { finalPrice } = applyOffer(item.selectedUnit.price, offer);
    item.finalUnitPrice = finalPrice;
    item.offPrice = finalPrice;
  }

  item.quantity = quantity;
  item.subtotal = item.finalUnitPrice * quantity;
  await item.save();

  await recalculateCart(cart._id);
  return getCart(userId);
};

const updateCartItemUnit = async (userId, itemId, unitIndex) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new NotFoundError("Cart not found");

  const item = await CartItem.findOne({ _id: itemId, cartId: cart._id });
  if (!item) throw new NotFoundError("Cart item not found");

  const product = await Product.findById(item.productId);
  if (!product) throw new NotFoundError("Product not found");

  let newUnit;
  if (
    unitIndex !== undefined &&
    product.availableUnits &&
    product.availableUnits[unitIndex]
  ) {
    newUnit = { label: product.availableUnits[unitIndex].label, metric: product.availableUnits[unitIndex].metric, measure: product.availableUnits[unitIndex].measure, price: product.availableUnits[unitIndex].price };
  } else {
    return getCart(userId);
  }

  const offer = await resolveBestOffer(item.productId, product.category);
  const { discount, finalPrice } = applyOffer(newUnit.price, offer);

  const existingItem = await CartItem.findOne({
    _id: { $ne: itemId },
    cartId: cart._id,
    productId: item.productId,
    "selectedUnit.label": newUnit.label,
    "selectedUnit.measure": newUnit.measure,
  });

  if (existingItem) {
    existingItem.quantity += item.quantity;
    existingItem.finalUnitPrice = finalPrice;
    existingItem.offPrice = finalPrice;
    existingItem.price = newUnit.price;
    existingItem.selectedUnit = newUnit;
    existingItem.subtotal = finalPrice * existingItem.quantity;
    existingItem.appliedOffer = offer
      ? { offerId: offer._id, type: offer.type, value: offer.value, discount }
      : { offerId: null, type: null, value: 0, discount: 0 };
    await existingItem.save();

    cart.items = cart.items.filter((i) => i.cartItemId.toString() !== itemId);
    await cart.save();
    await CartItem.findByIdAndDelete(itemId);
  } else {
    item.selectedUnit = newUnit;
    item.price = newUnit.price;
    item.finalUnitPrice = finalPrice;
    item.offPrice = finalPrice;
    item.subtotal = finalPrice * item.quantity;
    item.appliedOffer = offer
      ? { offerId: offer._id, type: offer.type, value: offer.value, discount }
      : { offerId: null, type: null, value: 0, discount: 0 };
    await item.save();
  }

  await recalculateCart(cart._id);
  return getCart(userId);
};

const removeCartItem = async (userId, itemId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new NotFoundError("Cart not found");

  const item = await CartItem.findOneAndDelete({
    _id: itemId,
    cartId: cart._id,
  });
  if (!item) throw new NotFoundError("Cart item not found");

  cart.items = cart.items.filter(
    (i) => i.cartItemId.toString() !== itemId,
  );
  await cart.save();

  await recalculateCart(cart._id);
  return getCart(userId);
};

const getCart = async (userId) => {
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart) {
    return { cart: null, items: [], totals: { totalAmount: 0, totalDiscount: 0, finalAmount: 0 } };
  }

  const itemIds = cart.items.map((i) => i.cartItemId);
  const items = await CartItem.find({ _id: { $in: itemIds } })
    .populate("productId")
    .lean();

  const mapped = items.map((item) => {
    const img = item.productId?.images?.[0];
    let unitIndex = 0;
    if (
      item.productId?.availableUnits &&
      item.selectedUnit &&
      item.selectedUnit.label
    ) {
      unitIndex = item.productId.availableUnits.findIndex(
        (u) =>
          u.label === item.selectedUnit.label &&
          u.measure === item.selectedUnit.measure,
      );
      if (unitIndex < 0) unitIndex = 0;
    }
    return {
      _id: item._id,
      quantity: item.quantity,
      selectedUnit: item.selectedUnit,
      finalUnitPrice: item.finalUnitPrice,
      subtotal: item.subtotal,
      appliedOffer: item.appliedOffer,
      price: item.price,
      offPrice: item.offPrice,
      unitIndex,
      product: item.productId
        ? {
            _id: item.productId._id,
            title: item.productId.name,
            price: item.productId.price,
            images: item.productId.images,
            imageUrl: img ? img.url : null,
            availableUnits: item.productId.availableUnits,
            slug: item.productId.slug,
          }
        : null,
    };
  });

  return {
    cart,
    items: mapped,
    totals: {
      totalAmount: cart.totalAmount || 0,
      totalDiscount: cart.totalDiscount || 0,
      finalAmount: cart.finalAmount || 0,
    },
  };
};

const recalculateCart = async (cartId) => {
  const items = await CartItem.find({ cartId }).lean();
  let totalAmount = 0;
  let totalDiscount = 0;

  for (const item of items) {
    totalAmount += item.subtotal || 0;
    totalDiscount += (item.appliedOffer?.discount || 0) * (item.quantity || 0);
  }

  await Cart.findByIdAndUpdate(cartId, {
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    finalAmount: Math.max(0, Math.round((totalAmount - totalDiscount) * 100) / 100),
  });
};

module.exports = {
  addCartItem,
  updateCartItemQuantity,
  updateCartItemUnit,
  removeCartItem,
  getCart,
  recalculateCart,
};
