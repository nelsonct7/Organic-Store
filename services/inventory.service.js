const Product = require("../collections/product.collection");
const { AppError } = require("../shared/utils/error.util");

/**
 * Verify stock availability for all cart items.
 * @param {Array} items - Array of { productId, selectedUnit, quantity }
 * @returns {Promise<{ valid: boolean, errors: Array<{ productId: string, message: string }> }>}
 */
const verifyStock = async (items) => {
  const errors = [];

  for (const item of items) {
    const product = await Product.findById(item.productId).lean();
    if (!product) {
      errors.push({ productId: item.productId.toString(), message: "Product not found" });
      continue;
    }

    const measure = item.selectedUnit?.measure || 0;
    const quantity = item.quantity || 0;
    const required = measure * quantity;

    if (required > 0 && product.stockIn < required) {
      errors.push({
        productId: item.productId.toString(),
        message: `Insufficient stock for ${product.name}. Required ${required} but only ${product.stockIn} available.`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Reserve inventory by reducing stock.
 * Runs inside a transaction session.
 * @param {Array} items - Array of { productId, selectedUnit, quantity }
 * @param {object} session - MongoDB session
 */
const reserveStock = async (items, session) => {
  for (const item of items) {
    const measure = item.selectedUnit?.measure || 0;
    const quantity = item.quantity || 0;
    const required = measure * quantity;

    if (required > 0) {
      const result = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stockIn: -required } },
        { session, new: true },
      );

      if (!result) {
        throw new AppError(`Product ${item.productId} not found during stock reservation`, 500);
      }
    }
  }
};

/**
 * Restore inventory by increasing stock (used on order cancel).
 * @param {Array} items - Array of { productId, selectedUnit, quantity }
 * @param {object} session - MongoDB session
 */
const restoreStock = async (items, session) => {
  for (const item of items) {
    const measure = item.selectedUnit?.measure || 0;
    const quantity = item.quantity || 0;
    const required = measure * quantity;

    if (required > 0) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stockIn: required } },
        { session, new: true },
      );
    }
  }
};

module.exports = { verifyStock, reserveStock, restoreStock };
