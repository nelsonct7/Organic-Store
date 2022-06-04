const express = require("express");
const prhelper = require("../helper/product-helper");
const usrhelper = require("../helper/user-helpers");
const router = express.Router();
const path = require("path");

const XLSX = require("xlsx");
const pdf = require("pdf-creator-node");
const fs = require("fs");
const async = require("hbs/lib/async");
const { json } = require("body-parser");
const { Db } = require("mongodb");
const { resolve } = require("path");

const verifyAdmin = (req, res, next) => {
  if (req.session.adminLoged) {
    next();
  } else {
    res.redirect("/admin");
  }
};

function generatePdf(Data, template) {
  var html = fs.readFileSync("./views/admin/" + template, "utf8");
  var options = {
    format: "A3",
    orientation: "portrait",
    border: "10mm",
    header: {
      height: "45mm",
      contents:
        '<div style="text-align: center;"><h1>Author: Organic Store</h1></div>',
    },
    footer: {
      height: "28mm",
      contents: {
        first: "Cover page",
        2: "Second page", // Any page number is working. 1-based index
        default:
          '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
        last: "Last Page",
      },
    },
  };
  var filename1 = Math.random() + "doc" + ".pdf";
  var filepath = "./public/documents/" + filename1;
  //var orders = await prhelper.getAllOrders()
  // console.log(users);
  var document = {
    html: html,
    data: {
      orders: Data,
    },
    path: filepath,
    type: "",
  };

  pdf
    .create(document, options)
    .then((res) => {
      // console.log("123123123123123"+JSON.stringify(res));
    })
    .catch((error) => {
      console.error(error);
    });
  return filename1;
}

function generateLimidPdf(orders) {
  var html = fs.readFileSync("./views/admin/template.html", "utf8");
  var options = {
    format: "A4",
    orientation: "portrait",
    border: "10mm",
    header: {
      height: "45mm",
      contents:
        '<div style="text-align: center;"><h3>Author: Organic Store</h3></div>',
    },
    footer: {
      height: "28mm",
      contents: {
        first: "Cover page",
        2: "Second page", // Any page number is working. 1-based index
        default:
          '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
        last: "Last Page",
      },
    },
  };
  var filename1 = Math.random() + "doc" + ".pdf";
  var filepath = "./public/documents/" + filename1;
  // console.log(users);
  var document = {
    html: html,
    data: {
      orders: orders,
    },
    path: filepath,
    type: "",
  };

  pdf.create(document, options).then((res) => {
    // console.log("123123123123123"+JSON.stringify(res));
  });
  return filename1;
}

router.get("/", verifyAdmin, async (req, res) => {
  console.log("ghhghghghhghgghghhgh");
  var html = fs.readFileSync("./views/admin/template.html", "utf8");
  var options = {
    format: "A3",
    orientation: "portrait",
    border: "10mm",
    header: {
      height: "45mm",
      contents: '<div style="text-align: center;">Author: Organic Store</div>',
    },
    footer: {
      height: "28mm",
      contents: {
        first: "Cover page",
        2: "Second page", // Any page number is working. 1-based index
        default:
          '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
        last: "Last Page",
      },
    },
  };
  var filename1 = Math.random() + "doc" + ".pdf";
  var filepath = "./public/documents/" + filename1;
  var orders = await prhelper.getAllOrders();
  // console.log(users);
  var document = {
    html: html,
    data: {
      orders: orders,
    },
    path: filepath,
    type: "",
  };

  pdf
    .create(document, options)
    .then((res) => {
      // console.log("123123123123123"+JSON.stringify(res));
    })
    .catch((error) => {
      console.error(error);
      res.render("errors/error404", {
        title: "Error",
        admin: req.session.admin,
      });
    });

  let order1 = await prhelper.getAllOrders();

  // const newObject = order1.reduce(function(result, item, index) {
  //   result[index] = item
  //   return result
  // }, {})

  console.log("\nExcel Data " + JSON.stringify(order1[0]));
  let pr = "";

  let orderXl = [];
  for (i = 0; i < order1.length; i++) {
    pr = "";
    for (j = 0; j < order1[i].products.length; j++) {
      pr += order1[i].products[j].product_id + " ";
    }
    orderXl[i] = {
      Id: order1[i]._id,
      User_Name: order1[i].user_info.user_name,
      User_Email: order1[i].user_info.user_email,
      User_Mobile: order1[i].user_info.user_mobile,
      Payment: order1[i].payment_option,
      Payment_status: order1[i].status,
      Deleted: order1[i].deleted,
      Dispatched: order1[i].dispatched,
      Address:
        order1[i].address.address_collection.first_name +
        ", " +
        order1[i].address.address_collection.second_name +
        ", " +
        order1[i].address.address_collection.house_name +
        ", " +
        order1[i].address.address_collection.street +
        ", " +
        order1[i].address.address_collection.town +
        ", " +
        order1[i].address.address_collection.pin,
      Date: order1[i].stringDate,
      Product: pr,
    };
  }
  xlname = convertJsonToExcel(orderXl);

  res.render("admin/view-reports", {
    path: filename1,
    admin: req.session.admin,
    xlpath: xlname,
  });
});

router.get("/view-reports", verifyAdmin, (req, res) => {
  res.render("admin/view-reports", { admin: req.session.admin });
});

router.get("/yearPdf", verifyAdmin, async (req, res) => {
  let yearOrder = await prhelper.getYearlyData();

  if (yearOrder) {
    let filename = generatePdf(yearOrder, "templateyear.html");
    console.log("rtrtrtrtrtrtrtrtrtrtr : " + filename);
    res.render("admin/reports", {
      title: "Admin",
      admin: req.session.admin,
      pdf: true,
      path: filename,
    });
  } else {
    res.redirect("/admin");
  }
});

router.get("/monthPdf", verifyAdmin, async (req, res) => {
  let monthOrder = await prhelper.getMonthlyData();
  if (monthOrder) {
    let filename = generatePdf(monthOrder, "templatemonth.html");
    res.render("admin/reports", {
      title: "Admin",
      admin: req.session.admin,
      pdf: true,
      path: filename,
    });
  } else {
    res.redirect("/admin");
  }
});

router.get("/dayPdf", verifyAdmin, async (req, res) => {
  let dailyOrder = await prhelper.getDailyData();
  if (dailyOrder) {
    let filename = generatePdf(dailyOrder, "templateday.html");
    res.render("admin/reports", {
      title: "Admin",
      admin: req.session.admin,
      pdf: true,
      path: filename,
    });
  } else {
    res.redirect("/admin");
  }
});

router.get("/yearXml", verifyAdmin, async (req, res) => {
  let yearOrder = await prhelper.getYearlyData();

  if (yearOrder) {
    let filename = generateXml(yearOrder);
    console.log("rtrtrtrtrtrtrtrtrtrtr : " + filename);
    res.render("admin/reports", {
      title: "Admin",
      admin: req.session.admin,
      xml: true,
      xlpath: filename,
    });
  } else {
    res.redirect("/admin");
  }
});

router.get("/monthXml", verifyAdmin, async (req, res) => {
  let monthOrder = await prhelper.getMonthlyData();
  if (monthOrder) {
    let filename = generateXml(monthOrder);
    res.render("admin/reports", {
      title: "Admin",
      admin: req.session.admin,
      xml: true,
      xlpath: filename,
    });
  } else {
    res.redirect("/admin");
  }
});

router.get("/dayXml", verifyAdmin, async (req, res) => {
  let dailyOrder = await prhelper.getDailyData();
  if (dailyOrder) {
    let filename = generateXml(dailyOrder);
    res.render("admin/reports", {
      title: "Admin",
      admin: req.session.admin,
      xml: true,
      xlpath: filename,
    });
  } else {
    res.redirect("/admin");
  }
});

router.post("/limitpdf", verifyAdmin, async (req, res) => {
  console.log("/nData");
  console.log(req.body);
  let sDate = req.body.sdate;
  let eDate = req.body.edate;
  let orders = await prhelper.getDateLimit(sDate, eDate);
  if (orders) {
    let filename = generateLimidPdf(orders);
    console.log("\ndfdff : " + orders);
    res.json({ status: true, file: filename });
  }
});

router.post("/limitxml", verifyAdmin, async (req, res) => {
  let sDate = req.body.sdate;
  let eDate = req.body.edate;
  let orders = await prhelper.getDateLimit(sDate, eDate);
  if (orders) {
    let filename = generateLimitXml(orders);
    console.log("\ndfdff : " + filename);
    res.json({ status: true, file: filename });
  }
});

function generateXml(data) {
  return convertJsonToExcel(data);
}
function generateLimitXml(order1) {
  let orderXl = [];
  for (i = 0; i < order1.length; i++) {
    pr = "";
    for (j = 0; j < order1[i].products.length; j++) {
      pr += order1[i].products[j].product_id + "\n";
    }
    orderXl[i] = {
      Id: order1[i]._id,
      User_Name: order1[i].user_info.user_name,
      User_Email: order1[i].user_info.user_email,
      User_Mobile: order1[i].user_info.user_mobile,
      Payment: order1[i].payment_option,
      Payment_status: order1[i].status,
      Total_Amount: order1[i].total_amount,
      Date: order1[i].ordDate,
      Product: pr,
    };
  }
  let xlname = convertJsonToExcel(orderXl);
  return xlname;
}

const convertJsonToExcel = (orders) => {
  let xlname = Date.now().toString();
  const workSheet = XLSX.utils.json_to_sheet(orders);
  const workBook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workBook, workSheet, xlname);
  // Generate buffer
  XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });

  // Binary string
  XLSX.write(workBook, { bookType: "xlsx", type: "binary" });

  XLSX.writeFile(workBook, "./public/documents/" + xlname + ".xlsx");
  return xlname;
};
module.exports = router;
