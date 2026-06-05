const express = require("express");
const router = express.Router();

router.get("/403", (req, res) => {
  res.status(403).render("errors/error403", {
    layout: false,
    title: "Access Forbidden",
  });
});

router.get("/404", (req, res) => {
  res.status(404).render("errors/error404-standalone", {
    layout: false,
    title: "Page Not Found",
    message: "The page you are looking for does not exist.",
  });
});

router.get("/500", (req, res) => {
  res.status(500).render("errors/error500", {
    layout: false,
    title: "Server Error",
    message: "An unexpected error occurred. Please try again later.",
  });
});

module.exports = router;
