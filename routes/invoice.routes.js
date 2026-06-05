const express = require("express");
const router = express.Router();
const invoiceCtrl = require("../controllers/invoice.controller");

router.get("/orders/:id/invoice", invoiceCtrl.downloadInvoice);

module.exports = router;
