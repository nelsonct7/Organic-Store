const express = require("express");
const {
  renderWishlist,
  toggleItem,
  checkItem,
} = require("../controllers/wishlist.controller");

const router = express.Router();

router.get("/wishlist", renderWishlist);
router.post("/wishlist/toggle/:id", toggleItem);
router.get("/api/wishlist/check/:id", checkItem);

module.exports = router;
