const express = require("express");
const {
  renderHomePage,
  renderAboutUsPage,
} = require("../controllers/base.controller");

const router = express.Router();

router.get("/", renderHomePage);
router.get("/home", renderHomePage);
router.get("/about-use", renderAboutUsPage);

module.exports = router;
