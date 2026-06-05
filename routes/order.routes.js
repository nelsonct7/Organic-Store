const express = require("express");
const { listOrders, getOrderById, getMyOrders, cancelOrder } = require("../controllers/order.controller");

const router = express.Router();

router.get("/orders", listOrders);
router.get("/orders/my-orders", getMyOrders);
router.get("/orders/:id", getOrderById);
router.patch("/orders/:id/cancel", cancelOrder);

module.exports = router;
