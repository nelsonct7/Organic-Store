const renderHomePage = (req, res) => {
  res.render("base/index", {
    title: "Welcome to Organic Store",
    user: req.user,
  });
};
const renderAboutUsPage = (req, res) => {
  res.render("base/about-us", {
    title: "About Us - Organic Store",
    user: req.user,
  });
};
const renderTermsPage = (req, res) => {
  res.render("base/terms-of-service", {
    title: "Terms of Service - Organic Store",
    user: req.user,
  });
};
const renderCareersPage = (req, res) => {
  res.render("base/careers", {
    title: "Careers - Organic Store",
    user: req.user,
  });
};
const renderPrivacyPage = (req, res) => {
  res.render("base/privacy-policy", {
    title: "Privacy Policy - Organic Store",
    user: req.user,
  });
};

module.exports = {
  renderHomePage,
  renderAboutUsPage,
  renderCareersPage,
  renderTermsPage,
  renderPrivacyPage,
};
