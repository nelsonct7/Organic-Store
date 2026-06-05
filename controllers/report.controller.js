const reportService = require("../services/report.service");

const renderViewReports = async (req, res, next) => {
  try {
    const orders = await reportService.getLatestOrders(5);
    res.render("admin/view-reports", {
      title: "View Reports - Organic Store",
      admin: true,
      adminData: req.session.admin,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

const getSalesPDF = async (req, res, next) => {
  try {
    const { type, sdate, edate } = req.query;
    const filename = await reportService.generateSalesPDF(type, sdate, edate);
    res.json({ status: true, file: filename });
  } catch (error) {
    next(error);
  }
};

const getSalesExcel = async (req, res, next) => {
  try {
    const { type, sdate, edate } = req.query;
    const filename = await reportService.generateSalesExcel(type, sdate, edate);
    res.json({ status: true, file: filename });
  } catch (error) {
    next(error);
  }
};

const downloadReport = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filepath = require("path").join(__dirname, "..", "public", "documents", filename);
    if (!require("fs").existsSync(filepath)) {
      return res.status(404).json({ status: false, message: "File not found" });
    }
    res.download(filepath);
  } catch (error) {
    next(error);
  }
};

module.exports = { renderViewReports, getSalesPDF, getSalesExcel, downloadReport };
