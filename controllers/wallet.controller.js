const walletService = require("../services/wallet.service");

const renderWalletPage = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/v1/auth/login");

    const wallet = await walletService.getWallet(userId);
    const transactions = (wallet.transactions || []).reverse();

    res.render("base/wallet", {
      title: "My Wallet - Organic Store",
      user: req.user,
      sessionUser: req.session.user,
      wallet,
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { renderWalletPage };