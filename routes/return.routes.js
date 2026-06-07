const express = require("express");
const {
  renderReturnPage,
  submitReturnRequest,
} = require("../controllers/return.controller");

const router = express.Router();

router.get("/orders/:orderId/return", renderReturnPage);
router.post("/orders/:orderId/return", submitReturnRequest);

module.exports = router;
