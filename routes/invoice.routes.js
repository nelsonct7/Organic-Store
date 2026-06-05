const express = require("express");
const router = express.Router();
const invoiceCtrl = require("../controllers/invoice.controller");

router.get("/orders/:id/invoice", invoiceCtrl.downloadInvoice);
router.post("/orders/:id/invoice/email", invoiceCtrl.emailInvoice);

module.exports = router;
