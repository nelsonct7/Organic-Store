const renderHomePage = (req, res) => {
  res.render("home", {
    title: "Welcome to Organic Store",
    user: req.user,
  });
};
const renderAboutUsPage = (req, res) => {
  res.render("about-us", {
    title: "About Us - Organic Store",
    user: req.user,
  });
};

module.exports = {
  renderHomePage,
  renderAboutUsPage,
};
