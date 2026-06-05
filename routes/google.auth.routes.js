const express = require("express");
const router = express.Router();
const passport = require("../config/passport.config");

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

const setUserSession = (req, user) => {
  req.session.userId = user._id?.toString ? user._id.toString() : user._id;
  req.session.user = {
    userId: user._id?.toString ? user._id.toString() : user._id,
    email: user.email,
    name: user.name,
    authProvider: user.authProvider,
  };
};

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash("error", info?.message || "Google authentication failed. Please try again.");
      return res.redirect("/v1/auth/login");
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      setUserSession(req, user);
      return res.redirect("/");
    });
  })(req, res, next);
});

module.exports = router;
