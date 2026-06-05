const Order = require("../collections/order.collection");
const invoiceService = require("../services/invoice.service");
const path = require("path");
const fs = require("fs");

const downloadInvoice = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ status: false, message: "Please login" });

    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ status: false, message: "Order not found" });
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ status: false, message: "Not your order" });
    }

    const filename = await invoiceService.generateInvoice(req.params.id);
    const filepath = path.join(__dirname, "..", "public", "documents", filename);

    if (!fs.existsSync(filepath)) {
      return res.status(500).json({ status: false, message: "Failed to generate invoice" });
    }

    res.download(filepath, `invoice-${req.params.id}.pdf`);
  } catch (error) {
    next(error);
  }
};

module.exports = { downloadInvoice };
