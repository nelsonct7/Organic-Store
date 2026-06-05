const express = require("express");
const {
  renderHomePage,
  renderAboutUsPage,
  renderCareersPage,
  renderTermsPage,
  renderPrivacyPage,
  renderCategoryProducts,
  renderAllProducts,
  searchProducts,
  renderViewProduct,
  addToCart,
  renderProfile,
} = require("../controllers/base.controller");

const router = express.Router();

router.get("/", renderHomePage);
router.get("/home", renderHomePage);
router.get("/about-us", renderAboutUsPage);
router.get("/careers", renderCareersPage);
router.get("/terms-of-service", renderTermsPage);
router.get("/privacy-policy", renderPrivacyPage);
router.get("/category/:id", renderCategoryProducts);
router.get("/products", renderAllProducts);
router.get("/api/search", searchProducts);
router.get("/view-product/:id", renderViewProduct);
router.get("/add-to-cart/:id", addToCart);
router.get("/view-profile", renderProfile);




module.exports = router;
