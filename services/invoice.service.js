const Order = require("../collections/order.collection");
const OrderItem = require("../collections/order-item.collection");
const pdf = require("pdf-creator-node");
const path = require("path");
const fs = require("fs");

const generateInvoiceHTML = (order, items, user, address) => {
  const itemsRows = items
    .map(
      (item, i) => `
    <tr>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${i + 1}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.selectedUnit?.label || item.selectedUnit?.measure + " " + item.selectedUnit?.metric || ""}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹ ${Number(item.finalUnitPrice).toFixed(2)}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹ ${Number(item.subtotal).toFixed(2)}</td>
    </tr>`,
    )
    .join("");

  const addressHtml = address
    ? `${address.name || ""}<br>${address.houseName || address.house_name || ""}, ${address.street || ""}<br>${address.town || ""}${address.pin ? " - " + address.pin : ""}`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #1f2937; }
    .invoice-box { max-width: 800px; margin: auto; padding: 30px; }
    .header { text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { color: #166534; margin: 0; font-size: 28px; }
    .header p { color: #6b7280; margin: 4px 0 0; }
    .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .details div { font-size: 13px; color: #4b5563; }
    .details strong { color: #1f2937; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #f0fdf4; color: #166534; padding: 10px; font-size: 13px; text-align: center; }
    td { font-size: 13px; }
    .totals { margin-top: 20px; text-align: right; }
    .totals table { width: auto; margin-left: auto; }
    .totals td { padding: 4px 16px; }
    .totals .grand-total td { font-weight: 700; font-size: 16px; color: #166534; border-top: 2px solid #16a34a; padding-top: 8px; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="header">
      <h1>Organic Store</h1>
      <p>Tax Invoice</p>
    </div>
    <div class="details">
      <div>
        <strong>Bill To:</strong><br>
        ${user?.name || "N/A"}<br>
        ${user?.email || ""}<br>
        ${user?.mobile || ""}
        ${addressHtml ? "<br><br><strong>Shipping Address:</strong><br>" + addressHtml : ""}
      </div>
      <div style="text-align: right;">
        <strong>Invoice #:</strong> ${order._id}<br>
        <strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}<br>
        <strong>Payment:</strong> ${(order.paymentMethod || "cod").toUpperCase()}<br>
        <strong>Status:</strong> ${order.status}
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:40px;">#</th>
          <th style="text-align:left;">Item</th>
          <th style="width:60px;">Unit</th>
          <th style="width:50px;">Qty</th>
          <th style="width:80px;">Rate</th>
          <th style="width:90px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
    <div class="totals">
      <table>
        <tr><td style="text-align:left;">Subtotal</td><td>₹ ${Number(order.subtotal || order.totalAmount).toFixed(2)}</td></tr>
        ${order.offerDiscount ? `<tr><td style="text-align:left;">Offer Discount</td><td style="color:#dc2626;">- ₹ ${Number(order.offerDiscount).toFixed(2)}</td></tr>` : ""}
        ${order.couponDiscount ? `<tr><td style="text-align:left;">Coupon Discount</td><td style="color:#dc2626;">- ₹ ${Number(order.couponDiscount).toFixed(2)}</td></tr>` : ""}
        <tr class="grand-total"><td style="text-align:left;">Grand Total</td><td>₹ ${Number(order.grandTotal || order.totalAmount).toFixed(2)}</td></tr>
      </table>
    </div>
    <div class="footer">
      Thank you for shopping with Organic Store!<br>
      For any queries, contact us through the Messages section on our website.
    </div>
  </div>
</body>
</html>`;
};

const generateInvoice = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("userId", "name email mobile")
    .populate("address")
    .lean();

  if (!order) throw new Error("Order not found");

  const itemIds = order.items.map((i) => i.orderItemId);
  const items = await OrderItem.find({ _id: { $in: itemIds } }).lean();

  const user = order.userId;
  const address = order.address;

  const html = generateInvoiceHTML(order, items, user, address);

  const filename = "invoice-" + orderId + "-" + Date.now() + ".pdf";
  const filepath = path.join(__dirname, "..", "public", "documents", filename);

  const doc = {
    html,
    data: {},
    path: filepath,
    type: "",
  };

  const options = {
    format: "A4",
    orientation: "portrait",
    border: "0mm",
  };

  await pdf.create(doc, options);
  return filename;
};

module.exports = { generateInvoice };
