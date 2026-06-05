const Order = require("../collections/order.collection");
const pdf = require("pdf-creator-node");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const TEMPLATES = {
  yearly: "templateyear.html",
  monthly: "templatemonth.html",
  daily: "templateday.html",
  custom: "template.html",
};

const SALES_STATUSES = ["placed", "shipped", "delivered"];

const getYearlySalesData = async () => {
  return Order.aggregate([
    { $match: { status: { $in: SALES_STATUSES } } },
    {
      $project: {
        year: { $year: "$createdAt" },
        totalAmount: 1,
      },
    },
    {
      $group: {
        _id: "$year",
        totalSaleAmount: { $sum: "$totalAmount" },
      },
    },
    { $sort: { _id: -1 } },
  ]);
};

const getMonthlySalesData = async () => {
  const monthsInString = [null, "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Order.aggregate([
    { $match: { status: { $in: SALES_STATUSES } } },
    {
      $project: {
        month: { $month: "$createdAt" },
        totalAmount: 1,
      },
    },
    {
      $addFields: {
        month: {
          $let: {
            vars: { monthsInString },
            in: { $arrayElemAt: [monthsInString, "$month"] },
          },
        },
      },
    },
    {
      $group: {
        _id: "$month",
        totalSaleAmount: { $sum: "$totalAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

const getDailySalesData = async () => {
  return Order.aggregate([
    { $match: { status: { $in: SALES_STATUSES } } },
    {
      $project: {
        stringDate: { $dateToString: { format: "%d-%m-%Y", date: "$createdAt" } },
        totalAmount: 1,
      },
    },
    {
      $group: {
        _id: "$stringDate",
        totalSaleAmount: { $sum: "$totalAmount" },
      },
    },
    { $sort: { _id: -1 } },
  ]);
};

const getCustomDateRangeData = async (sdate, edate) => {
  const orders = await Order.find({
    createdAt: {
      $gte: new Date(sdate + "T00:00:00.000Z"),
      $lte: new Date(edate + "T23:59:59.999Z"),
    },
  })
    .populate("userId", "name email mobile")
    .populate("items.orderItemId")
    .sort({ createdAt: -1 })
    .lean();

  return orders.map((o) => ({
    orderId: o._id.toString().slice(-8).toUpperCase(),
    ordDate: o.createdAt
      ? new Date(o.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "",
    customer: o.userId?.name || "N/A",
    email: o.userId?.email || "",
    mobile: o.userId?.mobile || "",
    payment_option: (o.paymentMethod || "cod").toUpperCase(),
    status: o.status.charAt(0).toUpperCase() + o.status.slice(1),
    statusClass: o.status === "delivered" ? "delivered" : o.status === "shipped" ? "shipped" : o.status === "cancelled" ? "cancelled" : "placed",
    total_amount: Number(o.totalAmount || 0).toFixed(2),
    offer_discount: Number(o.offerDiscount || 0).toFixed(2),
    coupon_discount: Number(o.couponDiscount || 0).toFixed(2),
    grand_total: Number(o.grandTotal || o.totalAmount || 0).toFixed(2),
    items: (o.items || []).map((i) => ({
      name: i.orderItemId?.productName || "Item",
      qty: i.orderItemId?.quantity || 0,
      price: Number(i.orderItemId?.finalUnitPrice || 0).toFixed(2),
      subtotal: Number(i.orderItemId?.subtotal || 0).toFixed(2),
    })),
  }));
};

const getLatestOrders = async (limit = 5) => {
  return Order.find({ status: { $in: SALES_STATUSES } })
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .then((orders) =>
      orders.map((o) => ({
        _id: o._id,
        user_data: o.userId?.name || "",
        total_amount: o.totalAmount,
        status: o.status,
        payment_option: o.paymentMethod,
      })),
    );
};

const generatePdfFile = async (templateName, data) => {
  const templatePath = path.join(__dirname, "..", "views", "admin", templateName);
  const html = fs.readFileSync(templatePath, "utf8");

  const filename = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".pdf";
  const filepath = path.join(__dirname, "..", "public", "documents", filename);

  const doc = {
    html,
    data: { orders: data },
    path: filepath,
    type: "",
  };

  const options = {
    format: "A4",
    orientation: "portrait",
    border: "10mm",
    header: {
      height: "35mm",
      contents: '<div style="text-align: center;"><h3>Organic Store</h3></div>',
    },
    footer: {
      height: "20mm",
      contents: {
        default: '<span style="color: #444;">Page {{page}} / {{pages}}</span>',
      },
    },
  };

  await pdf.create(doc, options);
  return filename;
};

const generateExcelFile = async (data, sheetName = "Sheet1") => {
  const filename = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".xlsx";
  const filepath = path.join(__dirname, "..", "public", "documents", filename);

  const workSheet = XLSX.utils.json_to_sheet(data);
  const workBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workBook, workSheet, sheetName);
  XLSX.writeFile(workBook, filepath);

  return filename;
};

const generateSalesPDF = async (type, sdate, edate) => {
  let data;
  let template;

  switch (type) {
    case "yearly":
      data = await getYearlySalesData();
      template = TEMPLATES.yearly;
      break;
    case "monthly":
      data = await getMonthlySalesData();
      template = TEMPLATES.monthly;
      break;
    case "daily":
      data = await getDailySalesData();
      template = TEMPLATES.daily;
      break;
    case "custom":
      data = await getCustomDateRangeData(sdate, edate);
      template = TEMPLATES.custom;
      break;
    default:
      throw new Error("Invalid report type");
  }

  return generatePdfFile(template, data);
};

const generateSalesExcel = async (type, sdate, edate) => {
  let data;

  switch (type) {
    case "yearly":
      data = await getYearlySalesData();
      data = data.map((d) => ({ Year: d._id, "Total Sale (₹)": d.totalSaleAmount }));
      break;
    case "monthly":
      data = await getMonthlySalesData();
      data = data.map((d) => ({ Month: d._id, "Total Sale (₹)": d.totalSaleAmount }));
      break;
    case "daily":
      data = await getDailySalesData();
      data = data.map((d) => ({ Date: d._id, "Total Sale (₹)": d.totalSaleAmount }));
      break;
    case "custom":
      data = await getCustomDateRangeData(sdate, edate);
      data = data.flatMap((d) =>
        d.items.length
          ? d.items.map((i) => ({
              "Order ID": d.orderId,
              Date: d.ordDate,
              Customer: d.customer,
              Email: d.email,
              Mobile: d.mobile,
              Item: i.name,
              Qty: i.qty,
              "Unit Price (₹)": i.price,
              "Subtotal (₹)": i.subtotal,
              Payment: d.payment_option,
              Status: d.status,
              "Offer Disc. (₹)": d.offer_discount,
              "Coupon Disc. (₹)": d.coupon_discount,
              "Grand Total (₹)": d.grand_total,
            }))
          : [
              {
                "Order ID": d.orderId,
                Date: d.ordDate,
                Customer: d.customer,
                Email: d.email,
                Mobile: d.mobile,
                Item: "—",
                Qty: "",
                "Unit Price (₹)": "",
                "Subtotal (₹)": "",
                Payment: d.payment_option,
                Status: d.status,
                "Offer Disc. (₹)": d.offer_discount,
                "Coupon Disc. (₹)": d.coupon_discount,
                "Grand Total (₹)": d.grand_total,
              },
            ],
      );
      break;
    default:
      throw new Error("Invalid report type");
  }

  return generateExcelFile(data, type + "-sales");
};

module.exports = {
  getYearlySalesData,
  getMonthlySalesData,
  getDailySalesData,
  getCustomDateRangeData,
  getLatestOrders,
  generatePdfFile,
  generateExcelFile,
  generateSalesPDF,
  generateSalesExcel,
};
