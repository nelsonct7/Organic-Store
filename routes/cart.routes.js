const express = require("express");
const {
  addCartItem,
  updateCartItem,
  deleteCartItem,
  getCartPage,
  applyCoupon,
  removeCoupon,
} = require("../controllers/cart.controller");

const router = express.Router();

router.get("/cart", getCartPage);
router.post("/cart/items", addCartItem);
router.patch("/cart/items/:itemId", updateCartItem);
router.delete("/cart/items/:itemId", deleteCartItem);
router.post("/cart/coupon", applyCoupon);
router.delete("/cart/coupon", removeCoupon);

module.exports = router;
