const { response } = require("express");
const express = require("express");
const { redirect } = require("express/lib/response");
const router = express.Router();
const prhelper = require("../helper/product-helper");
const usrhelper = require("../helper/user-helpers");
// var messagebird=require('messagebird')('rCPRMKLZeOYZrU17uDIucBatJ')
const config = require("../config/otpAuth");
const { reject } = require("bcrypt/promises");
const async = require("hbs/lib/async");
const userHelpers = require("../helper/user-helpers");
const { ObjectId } = require("mongodb");
const session = require("express-session");
const { json } = require("body-parser");
const client = require("twilio")(config.accountSID, config.authToken);

// midleware
function validTotp(req, res, dbResponse) {
  var number = `+91${dbResponse.user_mobile}`;
  client.verify
    .services(config.serviceSID)
    .verifications.create({
      to: number,
      channel: "sms",
    })
    .then((data) => {
      res.render("user/otpVerify", {
        number,
        dbResponse,
      });
    });
}

// function validateOtp(req,res,dbResponse,next){
// var number=`+91${dbResponse.user_mobile}`;
// console.log("Mobile number : "+number);
// messagebird.verify.create(number,
//     {template:"Your verification code is %token"},
//     (err,response)=>{
//       if(err){
//         res.render('user/userlogin',{logerr:req.session.otperr=true})
//       }else{
//         id=response.id
//         res.render('user/otpVerify',{number,id,dbResponse})
//       }
// })

// }
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  await prhelper.validateOffers();
  if (!req.session.loggedIn) {
    prhelper
      .getAllProducts()
      .then((products) => {
        prhelper
          .getBanner()
          .then((banner) => {
            prhelper.getAllCategory().then((category) => {
              res.render("user/index", {
                title: "Organic Store",
                products,
                banner,
                category,
              });
            });
          })
          .catch((err) => {
            res.render("errors/error404");
          });
      })
      .catch((err) => {
        res.render("errors/error404");
      });
  } else {
    let cartCount = 0;
    let walletBalance = 0;
    let delivery = false;
    let user = req.session.user;
    let deliveryStatus = false;
    if (req.session.loggedIn) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
      walletBalance = (
        await usrhelper.getValetAmount(req.session.user._id)
      ).toFixed(2);
      deliveryStatus = await usrhelper.getDeliveryStatus(req.session.user._id);
      if (deliveryStatus.length > 0) {
        delivery = true;
      }
    }
    let category = await prhelper.getAllCategory();
    prhelper
      .getAllProducts()
      .then((products) => {
        prhelper
          .getBanner()
          .then((banner) => {
            res.render("user/index", {
              title: "Home",
              user,
              products,
              cartCount,
              banner,
              category,
              walletBalance,
              delivery,
              deliveryStatus,
            });
          })
          .catch(() => {
            res.render("errors/error404");
          });
      })
      .catch((err) => {
        res.render("errors/error404");
      });
  }
});

router.get("/login", async function (req, res) {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    let category = await prhelper.getAllCategory();
    res.render("user/userlogin", {
      logerr: req.session.userError,
      category,
    });
    req.session.userError = false;
  }
});

router.post("/login", function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    usrhelper
      .doLogin(req.body)
      .then((response) => {
        if (response.status) {
          // validTotp(req,res,response)
          req.session.user = response;
          req.session.loggedIn = true;
          req.session.amountPay = null;
          res.redirect("/");
        } else {
          req.session.userError = true;
          res.redirect("/login");
        }
      })
      .catch((err) => {
        res.render("errors/error404");
      });
  }
});

router.get("/signup", async function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    let category = await prhelper.getAllCategory();
    prerr = req.session.prerror;
    res.render("user/usersignup", {
      title: "Signup",
      prerr,
      category,
    });
    req.session.prerror = false;
  }
});

router.post("/signup", function (req, res, next) {
  usrhelper
    .userPresent(req.body.user_email)
    .then((response) => {
      if (response.status) {
        req.session.prerror = true;
        res.redirect("/signup");
      } else {
        usrhelper
          .doSignup(req.body)
          .then((response) => {
            req.session.loggedIn = true;
            req.session.user = req.body.user_name;
            res.redirect("/");
          })
          .catch((err) => {
            res.render("errors/error404");
          });
      }
    })
    .catch((err) => {
      res.render("errors/error404");
    });
});

router.post("/delete-profile", verifyLogin, async (req, res) => {
  try {
    let userId = req.session.user._id;
    await usrhelper.deleteProfile(userId).then(() => {
      req.session.user = null;
      req.session.loggedIn = false;
      res.json({
        profileDeleted: true,
      });
    });
  } catch (err) {}
});

router.post("/otpauth/:number", (req, res) => {
  let userName = req.body.user;
  let number = req.params.number;
  client.verify
    .services(config.serviceSID)
    .verificationChecks.create({
      to: number,
      code: req.body.otp1,
    })
    .then((resp) => {
      if (resp.valid) {
        req.session.user = userName;
        console.log("session user : " + req.session.user);
        req.session.loggedIn = true;
        res.redirect("/");
      } else {
        res.render("user/userlogin", {
          otpError: true,
        });
      }
    })
    .catch((reject) => {
      console.log("Invalid OTP");
    });

  // let tocken=req.body.otp1
  // messagebird.verify.verify(id,tocken,(err,response)=>{
  // if(err){
  //     res.render('user/otpVerify',{id,dbResponse,otpError:true})
  // }else{

  //       req.session.user=dbResponse.user_name
  //       req.session.loggedIn=true
  //       res.redirect('/')
  // }
  // })
});

router.get("/logout", (req, res) => {
  req.session.loggedIn = false;
  req.session.user = null;
  res.redirect("/");
});

router.get("/view-product/:id", verifyLogin, async (req, res) => {
 
  await prhelper
    .getProductDetails(req.params.id)
    .then(async (product) => {
    
      let walletBalance = 0;
      let wallet = (
        await usrhelper.getValetAmount(req.session.user._id)
      ).toFixed(2);
      if (wallet) {
        walletBalance = wallet;
      }
      
      let cartCount = await usrhelper.getCartCount(req.session.user._id);
      let category = await prhelper.getAllCategory();
      let productPrice = (
        parseFloat(product.price) -
        parseFloat(product.price) * (parseFloat(product.offer) / 100)
      ).toFixed(2);
      let actualPrice = productPrice;
      for (i = 0; i < category.length; i++) {
        //console.log(category[i]['category-name']);
        if (category[i]["category-name"] === product.category) {
          actualPrice = (
            productPrice -
            productPrice * (parseFloat(category[i].offer) / 100)
          ).toFixed(2);
        }
      }
      res.render("user/view-products", {
        title: "Product View",
        product,
        cartCount,
        category,
        actualPrice,
        walletBalance,
      });
    })
    .catch((err) => {
      res.render("errors/error404");
    });
});

// User Cart routers

router.get("/check-out", verifyLogin, async (req, res) => {
  let walletBalance = 0;
  let wallet = (await usrhelper.getValetAmount(req.session.user._id)).toFixed(
    2
  );
  if (wallet) {
    walletBalance = wallet;
  }
  res.render("user/userCheckOut", {
    title: "CheckOut",
    user: req.session.user,
    walletBalance,
  });
});

router.get("/get-cart", verifyLogin, async (req, res) => {
  let walletBalance = 0;
  let wallet = await usrhelper.getValetAmount(req.session.user._id);
  if (wallet) {
    walletBalance = (
      await usrhelper.getValetAmount(req.session.user._id)
    ).toFixed(2);
  }
  let count = await usrhelper.getCartCount(req.session.user._id);
  let category = await prhelper.getAllCategory();
  if (count) {
    let products = await usrhelper.getCartProducts(req.session.user._id);
    let total = await usrhelper.findCartTotal(req.session.user._id);

    res.render("user/userCart", {
      title: "Cart",
      user: req.session.user,
      products,
      total,
      category,
      walletBalance,
    });
  } else {
    res.render("user/cart-empty", {
      title: "Empty Cart",
      user: req.session.user,
      category,
      walletBalance,
    });
  }
});

router.get("/add-to-cart/:id", verifyLogin, (req, res) => {
  usrhelper
    .addToCart(req.params.id, req.session.user._id)
    .then(() => {
      res.json({
        status: true,
      });
    })
    .catch((err) => {
      res.render("errors/error404");
    });
});

router.post("/cart-Product-Inc-Dec", verifyLogin, async (req, res) => {
  console.log("request reached " + JSON.stringify(req.body));

  await usrhelper
    .updateCartQuantity(req.body)
    .then(async (response) => {
      response.total = await usrhelper.findCartTotal(req.body.userId);
      res.json(response);
    })
    .catch((err) => {
      res.render("errors/error404");
    });
});

router.get("/remove-item-from-cart/:id", verifyLogin, (req, res) => {
  usrhelper
    .removeCartItem(req.params.id, req.session.user._id)
    .then((resolve) => {
      res.redirect("/get-cart");
    })
    .catch((err) => {
      res.render("errors/error404");
    });
});

router.get("/find-total/:id", verifyLogin, async (req, res) => {
  userId = req.params.id;
  let walletBalance = 0;
  let wallet = (await usrhelper.getValetAmount(req.session.user._id)).toFixed(
    2
  );
  if (wallet) {
    walletBalance = wallet;
  }
  let total = await usrhelper.findCartTotal(userId);
  let address = await usrhelper.getAllAddressUser(userId);
  let category = await prhelper.getAllCategory();
  let amountPayable = parseFloat(total - walletBalance).toFixed(2);
  if (amountPayable <= 0) {
    amountPayable = 0;
  }
  if (address) {
    res.render("user/check-out", {
      title: "Check Out",
      user: req.session.user,
      total,
      address,
      category,
      walletBalance,
      amountPayable,
    });
  } else {
    res.render("user/add-address", {
      title: "Check Out",
      user: req.session.user,
      total,
      category,
      walletBalance,
      amountPayable,
    });
  }
});

router.post("/proceed-to-payment", verifyLogin, async (req, res) => {
  let htotal = parseFloat(req.body.total);
  let amountPay = parseFloat(req.body.amountPay);
  let wallet = parseFloat(req.body.wallet);
  let category = await prhelper.getAllCategory();
  let walletBalance = 0;
  let walletB = (await usrhelper.getValetAmount(req.session.user._id)).toFixed(
    2
  );
  let paymentByWallet = false;
  req.session.amountPay = amountPay;
  if (walletB) {
    walletBalance = walletB;
  }
  let user_id = req.session.user._id;
  if (amountPay === 0) {
    await usrhelper.updateWallet(wallet - htotal, req.session.user._id);
    walletBalance = (
      await usrhelper.getValetAmount(req.session.user._id)
    ).toFixed(2);
    paymentByWallet = true;
  } else {
    await usrhelper.updateWallet(0, req.session.user._id);
    walletBalance = (
      await usrhelper.getValetAmount(req.session.user._id)
    ).toFixed(2);
  }

  await usrhelper
    .updateAddress(req.body)
    .then(async (responce) => {
      adr_id = responce.insertedId;
      let details1 = await usrhelper.getUserAddress(adr_id);
      let total = (await usrhelper.findCartTotal(user_id)).toFixed(2);
      res.render("user/payment-confirm", {
        title: "Payment",
        user: req.session.user,
        details: details1,
        total,
        category,
        walletBalance,
        amountPay,
        paymentByWallet,
      });
    })
    .catch((err) => {
      res.render("errors/error404");
    });
});

router.get("/proceed-to-payment", verifyLogin, async (req, res) => {
  let user_id = req.session.user._id;
  let total = await usrhelper.findCartTotal(user_id);
  let category = await prhelper.getAllCategory();
  let walletBalance = 0;
  let amountPayable = 0;
  wallet = (await usrhelper.getValetAmount(req.session.user._id)).toFixed(2);
  if (wallet) {
    walletBalance = parseFloat(wallet).toFixed(2);
  }
  amountPayable = parseFloat(total - walletBalance).toFixed(2);
  if (amountPayable <= 0) {
    amountPayable = 0;
  }

  res.render("user/add-address", {
    title: "Check Out",
    user: req.session.user,
    total,
    category,
    walletBalance,
    amountPayable,
  });
});

router.post("/proceed-to-payment-address", verifyLogin, async (req, res) => {
  console.log(req.body);
  let htotal = parseFloat(req.body.total);
  let amountPay = parseFloat(req.body.amountPay);
  let wallet = parseFloat(req.body.wallet);
  let adrId = req.body.arrdessIndex;
  let user_id = req.session.user._id;
  let details1 = await usrhelper.getUserAddress(adrId);
  let category = await prhelper.getAllCategory();
  let total = await usrhelper.findCartTotal(user_id);
  let walletBalance = (
    await usrhelper.getValetAmount(req.session.user._id)
  ).toFixed(2);
  req.session.amountPay = amountPay;
  let paymentByWallet = false;
  if (amountPay === 0) {
    await usrhelper.updateWallet(wallet - htotal, req.session.user._id);
    walletBalance = await usrhelper.getValetAmount(req.session.user._id);
    paymentByWallet = true;
  } else {
    await usrhelper.updateWallet(0, req.session.user._id);
    walletBalance = await usrhelper.getValetAmount(req.session.user._id);
  }
  res.render("user/payment-confirm", {
    title: "Payment",
    user: req.session.user,
    details: details1,
    total,
    amountPay,
    category,
    walletBalance,
    paymentByWallet,
  });
});

router.post("/place-order", verifyLogin, async (req, res) => {
  let amountPay = req.session.amountPay;
  let user_id = req.session.user._id;
  let adr_id = req.body.addressId;
  let details = await usrhelper.getUserAddress(adr_id);
  let category = await prhelper.getAllCategory();
  let addressId1 = details._id;
  let total = await usrhelper.findCartTotal(user_id);
  let prList = await usrhelper.getCartProductsList(user_id);
  await usrhelper.decreaseProducts(prList);
  usrhelper.removeCart(user_id);
  let payment_option = req.body.paymentOptions;
  req.session.total = total;
  req.session.prlist = prList;

  if (prList.length > 0) {
    usrhelper
      .addToOrder(user_id, addressId1, total, payment_option, prList)
      .then((response) => {
        let orderId = response.insertedId;
        req.session.orderId = orderId;
        if (amountPay > 0) {
          total = amountPay;
        }
        console.log("/n : order id :" + orderId);
        if (payment_option == "cod") {
          res.json({
            codSuccess: true,
          });
        }
        if (payment_option == "wallet") {
          res.json({
            walletSuccess: true,
          });
        }

        if (payment_option == "razor") {
          usrhelper
            .generateRazor(orderId, total)
            .then((data) => {
              res.json({
                razorSuccess: true,
                order: data,
                user: req.session.user,
              });
            })
            .catch((eror) => {
              console.log("\n////Error : " + JSON.stringify(eror));
              res.json({
                razorError: true,
              });
            });
        }

        if (payment_option == "paypal") {
          usrhelper
            .generatePaypal(orderId, total, (user = req.session.user))
            .then((data) => {
              res.json({
                paypalSuccess: true,
                data,
              });
            })
            .catch((err) => {
              console.log("Error..: ");
            });
        }
      })
      .catch((err) => {
        res.render("errors/error404");
      });
  } else {
    res.json({
      razorError: true,
    });
  }
});

router.get("/paypallSuccess", (req, res) => {
  const paypal = require("paypal-rest-sdk");
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  let amountPay = req.session.amountPay;
  let total = req.session.total;
  if (amountPay > 0) {
    total = amountPay;
  }
  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: total,
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        console.log(error.response);
        // throw error;
        console.log("Error : " + error);
      } else {
        usrhelper.changeStatus(req.session.orderId).then(() => {
          let category = prhelper.getAllCategory();
          let total = req.session.total;
          let orderId = req.session.orderId;
          let prList = req.session.prlist;
          res.render("user/order-success", {
            title: "Order Success",
            total,
            orderId,
            prList,
            category,
          });
        });
      }
    }
  );
});

router.post("/verifyPayment", (req, res) => {
  console.log("Data in router : " + JSON.stringify(req.body));
  let data = req.body;
  usrhelper
    .verifyPayment(data)
    .then(() => {
      usrhelper.changeStatus(data.order.receipt).then((resp) => {
        console.log("Updated Success fully");
        res.json(true);
      });
    })
    .catch(() => {
      console.log("Failed Transaction");
    });
});

router.get("/view-orders", verifyLogin, async (req, res) => {
  userId = req.session.user._id;
  let orders = await usrhelper.getOrders(userId);
  let category = await prhelper.getAllCategory();
  let walletBalance = 0;
  walletBalance = (
    await usrhelper.getValetAmount(req.session.user._id)
  ).toFixed(2);
  if (orders.length != 0) {
    res.render("user/view-orders", {
      title: "Orders",
      user: req.session.user,
      orders,
      category,
      walletBalance,
    });
  } else {
    res.render("user/empty-orders", {
      title: "Orders",
      user: req.session.user,
      category,
    });
  }
});

router.get("/remove-order/:id", verifyLogin, async (req, res) => {
  let userId = req.session.user._id;
  let orderId = req.params.id;
  let category = await prhelper.getAllCategory();
  let walletBalance = 0;
  walletBalance = (
    await usrhelper.getValetAmount(req.session.user._id)
  ).toFixed(2);
  await usrhelper.removeOrder(orderId).then(async (response) => {
    let orders = await usrhelper.getOrders(userId);
    res.render("user/view-orders", {
      title: "Orders",
      user: req.session.user,
      orders,
      category,
      walletBalance,
    });
  });
});

router.get("/view-order-products/:id/:total", verifyLogin, async (req, res) => {

  let orderId = req.params.id;
  let total = req.params.total;
  let category = await prhelper.getAllCategory();
  let products = await usrhelper.getOrderProducts(orderId);
  let walletBalance = 0;
  walletBalance = (
    await usrhelper.getValetAmount(req.session.user._id)
  ).toFixed(2);
    console.log('\n\nControl is here');
    console.log(walletBalance);
  res.render("user/view-order-products", {
    title: "Order Products",
    user: req.session.user,
    products,
    orderId,
    total,
    category,
    walletBalance,
  });
});

router.get("/view-order-history", verifyLogin, async (req, res) => {
  let userId = req.session.user._id;
  let orders = await usrhelper.getAllOrders(userId);
  let category = await prhelper.getAllCategory();
  let walletBalance = 0;
  walletBalance = (
    await usrhelper.getValetAmount(req.session.user._id)
  ).toFixed(2);
  res.render("user/view-order-history", {
    title: "History",
    orders,
    category,
    walletBalance,
  });
});

router.get("/view-profile", verifyLogin, async (req, res) => {
  let updateSuccess = false;
  if (req.session.prupdate) {
    updateSuccess = true;
  }
  let walletBalance = 0;
  walletBalance = (
    await usrhelper.getValetAmount(req.session.user._id)
  ).toFixed(2);
  req.session.prupdate = false;
  let category = await prhelper.getAllCategory();
  let userAddress = await usrhelper.getAllAddressUser(req.session.user._id);
  res.render("user/user-profile", {
    title: "User Profile",
    user: req.session.user,
    userAddress,
    updateSuccess,
    category,
    walletBalance,
  });
});

router.post("/edit-address/:id", verifyLogin, async (req, res) => {
  let adrId = req.params.id;
  console.log("\nAddress Id : " + JSON.stringify(adrId));
  let editAddress = await usrhelper.getUserAddress(adrId);
  let category = await prhelper.getAllCategory();
  let walletBalance = 0;
  walletBalance = (
    await usrhelper.getValetAmount(req.session.user._id)
  ).toFixed(2);
  res.render("user/edit-address", {
    title: "Address Edit",
    editAddress,
    category,
    walletBalance,
  });
});

router.post("/update-user-address", verifyLogin, async (req, res) => {
  await usrhelper
    .updateUserAddress(req.body)
    .then((response) => {
      res.redirect("/view-profile");
    })
    .catch((err) => {
      res.render("errors/error404");
    });
});

router.get("/edit-profile", verifyLogin, async (req, res) => {
  let category = await prhelper.getAllCategory();
  let walletBalance = 0;
  walletBalance = (
    await usrhelper.getValetAmount(req.session.user._id)
  ).toFixed(2);
  res.render("user/edit-profile", {
    title: "Profile",
    user: req.session.user,
    category,
    walletBalance,
  });
});

router.post("/edit-profile", verifyLogin, async (req, res) => {
  console.log(req.body);
  let usrId = req.session.user._id;
  await usrhelper
    .updateProfile(usrId, req.body)
    .then((data) => {
      req.session.prupdate = true;
      res.redirect("/view-profile");
    })
    .catch((err) => {
      res.render("errors/error404");
    });
});

router.get("/change-password", verifyLogin, async (req, res) => {
  let chpsd = null;
  let notchpsd = null;
  if (req.session.psdCh) {
    chpsd = true;
    req.session.psdCh = null;
  }
  if (req.session.notpsdCh) {
    notchpsd = true;
    req.session.notpsdCh = null;
  }
  let walletBalance = 0;
  walletBalance = (
    await usrhelper.getValetAmount(req.session.user._id)
  ).toFixed(2);
  let category = await prhelper.getAllCategory();
  res.render("user/change-password", {
    title: "Profile",
    user: req.session.user,
    chpsd,
    notchpsd,
    category,
    walletBalance,
  });
});

router.post("/change-password", verifyLogin, async (req, res) => {
  await usrhelper
    .updatePassword(req.body)
    .then((responce) => {
      if (responce.status) {
        req.session.psdCh = true;
        res.redirect("/change-password");
      } else {
        req.session.notpsdCh = true;
        res.redirect("/change-password");
      }
    })
    .catch((err) => {
      res.render("errors/error404");
    });
});

router.get("/category/:name", async (req, res) => {
  let cartCount = null;
  let walletBalance = 0;
  if (req.session.loggedIn) {
    cartCount = await usrhelper.getCartCount(req.session.user._id);
    walletBalance = (
      await usrhelper.getValetAmount(req.session.user._id)
    ).toFixed(2);
  }
  let category = await prhelper.getAllCategory();
  await prhelper.getProductsByCategory(req.params.name).then((products) => {
    res.render("user/category-view", {
      title: "Category",
      user: req.session.user,
      category,
      products,
      cartCount,
      walletBalance,
    });
  });
});

router.post("/check-coupon/:coupon", verifyLogin, async (req, res) => {
  userCoupon = req.params.coupon;
  await prhelper.checkCoupon(userCoupon).then(async (data) => {
    console.log(data);
    if (data == false) {
      res.json({
        couponInvalid: true,
      });
    } else {
      let nowDate = new Date().toISOString().split("T")[0];
      let start_date = data.start_date.toISOString().split("T")[0];
      if (nowDate > data.end_date && nowDate < start_date) {
        res.json({
          couponExpired: true,
        });
      } else if (data.users.includes(req.session.user._id)) {
        res.json({
          couponUsed: true,
        });
      } else {
        await prhelper
          .couponUsed(data._id, req.session.user._id, data.offer)
          .then(async () => {
            let total = await usrhelper.findCartTotal(req.session.user._id);
            res.json({
              couponSuccess: true,
              couponTotal: total,
            });
          });
      }
    }
  });
});

router.get("/getMessageUser", verifyLogin, async (req, res) => {
  let walletBalance = 0;
  walletBalance = (
    await usrhelper.getValetAmount(req.session.user._id)
  ).toFixed(2);
  let msgs = await usrhelper.getUserMessages(req.session.user._id);
  if (msgs) {
    res.render("user/message-box", {
      title: "Message",
      user: req.session.user,
      msgs,
      walletBalance,
    });
  } else {
    res.render("user/message-box", {
      title: "Message",
      user: req.session.user,
      msgs: null,
      walletBalance,
    });
  }
});

router.post("/cancel-order/:id", verifyLogin, async (req, res) => {
  await prhelper
    .cancelOrder(req.params.id)
    .then(async (data) => {
      console.log("\nOrder Deletion details : " + JSON.stringify(data));
      let waletAmount = (
        await usrhelper.getValetAmount(req.session.user._id)
      ).toFixed(2);
      if (data.dateExceeded) {
        res.json({
          dateError: true,
          walletBal: waletAmount,
        });
      } else if (data.orderPending) {
        res.json({
          pendingError: true,
          walletBal: waletAmount,
        });
      } else if (data.orderDeleted) {
        res.json({
          orderDeleted: true,
          walletBal: waletAmount,
        });
      } else {
        res.json({
          sysError: true,
          walletBal: waletAmount,
        });
      }
    })
    .catch((err) => {
      res.json({
        success: false,
      });
    });
});

router.post("/save-textfeedback", verifyLogin, async (req, res) => {
  console.log("Dtaaaa");
  console.log(JSON.stringify(req.body));
  await prhelper
    .addFeedback(req.session.user._id, req.body.feedback)
    .then(() => {
      res.json({
        feedbackSatatus: true,
      });
    })
    .catch(() => {
      res.json({
        feedbackSatatus: false,
      });
    });
});

router.post("/userMessage", verifyLogin, async (req, res) => {
  await usrhelper
    .addMessage(req.body, req.session.user._id)
    .then((data) => {
      res.json(true);
    })
    .catch((err) => {
      res.json(false);
    });
});

router.get("/pricerange/:value", async (req, res) => {
  console.log('Control Here');
  let startPrice = parseInt(req.params.value);
  let cartCount = null;
  let walletBalance = 0;
  if (req.session.loggedIn) {
    cartCount = await usrhelper.getCartCount(req.session.user._id);
    walletBalance = (
      await usrhelper.getValetAmount(req.session.user._id)
    ).toFixed(2);
  }
  let category = await prhelper.getAllCategory();
  await prhelper.getProductsPrice(startPrice).then((products) => {
    res.render("user/category-view", {
      title: "Category",
      user: req.session.user,
      category,
      products,
      cartCount,
      walletBalance,
    });
  });
});

router.get('/about-us',(req,res)=>{
    res.render('user/about-us')
})

router.get('/delivery',(req,res)=>{
  res.render('user/delivery')
})

router.get('/securepay',(req,res)=>{
  res.render('user/secure-pay')
})

module.exports = router;
