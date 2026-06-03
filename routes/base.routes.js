const express = require("express");
const {
  renderHomePage,
  renderAboutUsPage,
  renderCareersPage,
  renderTermsPage,
  renderPrivacyPage,
} = require("../controllers/base.controller");

const router = express.Router();

router.get("/", renderHomePage);
router.get("/home", renderHomePage);
router.get("/about-us", renderAboutUsPage);
router.get("/careers", renderCareersPage);
router.get("/terms-of-service", renderTermsPage);
router.get("/privacy-policy", renderPrivacyPage);

module.exports = router;
