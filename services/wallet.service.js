const Wallet = require("../collections/wallet.collection");
const { ValidationError, NotFoundError } = require("../shared/utils/error.util");

const getWallet = async (userId) => {
  let wallet = await Wallet.findOne({ userId }).lean();
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
    wallet = wallet.toObject();
  }
  return wallet;
};

const credit = async (userId, amount, description = "", reference = null) => {
  if (amount <= 0) throw new ValidationError("Credit amount must be positive");

  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
  }

  const balanceBefore = wallet.balance;
  wallet.balance += amount;
  wallet.transactions.push({
    type: "credit",
    amount,
    balanceBefore,
    balanceAfter: wallet.balance,
    description,
    reference,
  });
  await wallet.save();
  return wallet;
};

const debit = async (userId, amount, description = "", reference = null) => {
  if (amount <= 0) throw new ValidationError("Debit amount must be positive");

  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    throw new NotFoundError("Wallet not found");
  }

  if (wallet.balance < amount) {
    throw new ValidationError("Insufficient wallet balance");
  }

  const balanceBefore = wallet.balance;
  wallet.balance -= amount;
  wallet.transactions.push({
    type: "debit",
    amount,
    balanceBefore,
    balanceAfter: wallet.balance,
    description,
    reference,
  });
  await wallet.save();
  return wallet;
};

const hasSufficientBalance = async (userId, amount) => {
  const wallet = await Wallet.findOne({ userId }).lean();
  if (!wallet) return false;
  return wallet.balance >= amount;
};

module.exports = { getWallet, credit, debit, hasSufficientBalance };
