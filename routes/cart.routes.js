const express = require("express");
const {
  addCartItem,
  updateCartItem,
  deleteCartItem,
  getCartPage,
} = require("../controllers/cart.controller");

const router = express.Router();

router.get("/cart", getCartPage);
router.post("/cart/items", addCartItem);
router.patch("/cart/items/:itemId", updateCartItem);
router.delete("/cart/items/:itemId", deleteCartItem);

module.exports = router;
