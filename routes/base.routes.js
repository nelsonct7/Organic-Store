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
  updateProfileMobile,
  addProfileAddress,
  updateProfileAddress,
  deleteProfileAddress,
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
router.put("/profile/mobile", updateProfileMobile);
router.post("/profile/address", addProfileAddress);
router.put("/profile/address/:id", updateProfileAddress);
router.delete("/profile/address/:id", deleteProfileAddress);

/* ---- Wallet ---- */
const walletCtrl = require("../controllers/wallet.controller");
router.get("/wallet", walletCtrl.renderWalletPage);

/* ---- Feedback ---- */
const feedbackCtrl = require("../controllers/feedback.controller");
router.get("/feedback", feedbackCtrl.renderFeedbackForm);
router.post("/feedback", feedbackCtrl.postFeedback);

/* ---- Messages ---- */
const messageCtrl = require("../controllers/message.controller");
router.get("/messages", messageCtrl.renderUserMessages);
router.post("/messages", messageCtrl.postUserMessage);
router.get("/messages/:id", messageCtrl.getConversationData);
router.post("/messages/:id/reply", messageCtrl.postUserReply);

module.exports = router;
