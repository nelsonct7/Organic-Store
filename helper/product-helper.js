const { reject } = require("bcrypt/promises");
const { response } = require("express");
var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const multer = require("multer");
const async = require("hbs/lib/async");
const { json } = require("body-parser");
const upload = multer({ dest: "uploads/" });

module.exports = {
  addProduct: (product, callback) => {
    product.price = parseInt(product.price);
    product['godown-stock'] = parseInt(product['godown-stock']);
    product.date = new Date().toDateString();
    product.deleted = false;
    product.offerstatus = false;
    product.offer = 0;
    product.offer_start = null;
    product.offer_end = null;
    db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .insertOne(product)
      .then((data) => {
        callback(data);
      });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: { deleted: false },
          },
          {
            $lookup: {
              from: collection.CATEGORY_COLLECTION,
              localField: "category",
              foreignField: "category-name",
              as: "categoryInfo",
            },
          },
          {
            $unwind: "$categoryInfo",
          },
          {
            $project: {
              title: 1,
              category: 1,
              description: 1,
              "storage-spec": 1,
              price: 1,
              "godown-stock": 1,
              status: 1,
              img_path: 1,
              categoryInfo: 1,
              productprice: {
                $subtract: [
                  "$price",
                  {
                    $multiply: [
                      "$price",
                      { $divide: [{ $toInt: "$offer" }, 100] },
                    ],
                  },
                ],
              },
            },
          },
          {
            $project: {
              title: 1,
              category: 1,
              description: 1,
              "storage-spec": 1,
              price: 1,
              "godown-stock": 1,
              status: 1,
              img_path: 1,
              categoryInfo: 1,
              productprice: 1,
              actualprice: {
                $round: [
                  {
                    $subtract: [
                      "$productprice",
                      {
                        $multiply: [
                          "$productprice",
                          { $divide: [{ $toInt: "$categoryInfo.offer" }, 100] },
                        ],
                      },
                    ],
                  },
                  2,
                ],
              },
            },
          },
        ])
        .toArray();
      resolve(products);
    });
  },
  getAllProductsAdmin: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ deleted: false })
        .toArray();
      resolve(products);
    });
  },
  deleteProduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: objectId(proId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getProductDetails: (proId) => {
   
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(proId) })
        .then((product) => {
          resolve(product);
        });
    });
  },
  getProductsByCategory: (catName) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: { category: catName },
          },
          {
            $lookup: {
              from: collection.CATEGORY_COLLECTION,
              localField: "category",
              foreignField: "category-name",
              as: "categoryInfo",
            },
          },
          {
            $unwind: "$categoryInfo",
          },
          {
            $project: {
              title: 1,
              category: 1,
              description: 1,
              "storage-spec": 1,
              price: 1,
              img_path: 1,
              "categoryInfo.offer": 1,
              actualPrice: {
                $subtract: [
                  "$price",
                  {
                    $multiply: [
                      "$price",
                      { $divide: [{ $toInt: "$offer" }, 100] },
                    ],
                  },
                ],
              },
            },
          },
          {
            $project: {
              title: 1,
              category: 1,
              description: 1,
              "storage-spec": 1,
              price: 1,
              img_path: 1,
              actualPrice: 1,
              finalPrice: {
                $subtract: [
                  "$actualPrice",
                  {
                    $multiply: [
                      "$actualPrice",
                      { $divide: [{ $toInt: "$categoryInfo.offer" }, 100] },
                    ],
                  },
                ],
              },
            },
          },
          {
            $project: {
              title: 1,
              category: 1,
              description: 1,
              "storage-spec": 1,
              price: 1,
              img_path: 1,
              actualPrice: 1,
              "categoryInfo.offer": 1,
              finalPrice: 1,
              discount: {
                $round: [{ $subtract: ["$price", "$finalPrice"] }, 2],
              },
            },
          },
        ])
        .toArray();
      resolve(products);
    });
  },
  updateProduct: (proId, proDetails) => {
    if (proDetails.deleted == "false") {
      proDetails.deleted = false;
    } else {
      proDetails.deleted = true;
    }
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              title: proDetails.title,
              category: proDetails.category,
              description: proDetails.description,
              "storage-spec": proDetails.storagespec,

              price: parseInt(proDetails.price),
              "godown-stock": parseInt(proDetails.godownstock),
              status: proDetails.status,
              date: new Date().toDateString(),
              deleted: proDetails.deleted,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  getProductInfoOffer: () => {
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: { deleted: false },
          },
          {
            $project: {
              title: 1,
              price: 1,
              img_path: 1,
              offer: 1,
              offerstatus: 1,
            },
          },
        ])
        .toArray();
      resolve(data);
    });
  },

  addoffer: (data) => {
    return new Promise(async (resolve, reject) => {
      let prId = data.prId;
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(prId) },
          {
            $set: {
              offer: data.offer,
              offer_start: new Date().toString(),
              offer_end: data.enddate,
              offerstatus: true,
            },
          }
        )
        .then((resp) => {
          resolve();
        })
        .catch((err) => {
          reject();
        });
    });
  },

  removeOffer: (prId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(prId) },
          {
            $set: {
              offer: 0,
              offer_start: null,
              offer_end: null,
              offerstatus: false,
            },
          }
        )
        .then((resp) => {
          resolve();
        })
        .catch((err) => {
          reject();
        });
    });
  },
  getCategory: () => {
    return new Promise(async (resolve, reject) => {
      let category = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray();
      resolve(category);
    });
  },
  addCategory: (category, callback) => {
    category.img_path = false;
    category.deleted = false;
    (category.offer = 0),
      (category.offer_start = null),
      (category.offer_end = null),
      (category.offerstatus = false);
    db.get()
      .collection(collection.CATEGORY_COLLECTION)
      .insertOne(category)
      .then((data) => {
        callback(data);
      });
  },
  updateCategoryImage: (category_id, image_path) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { _id: objectId(category_id) },
          {
            $set: {
              img_path: image_path,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  getCategoryByID: (catId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ _id: objectId(catId) })
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          reject();
        });
    });
  },

  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      let categories = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)  
        .find({ deleted: false })
        .toArray()
          resolve(categories);      
    });
  },
  deleteCategory: (CategoryId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { _id: objectId(CategoryId) },
          {
            $set: {
              deleted: true,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  updateCategory: (categoryId, category) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { _id: objectId(categoryId) },
          {
            $set: {
              "category-name": category.categoryname,
              "category-description": category.categorydescription,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  getCategoryDetails: (categoryId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ _id: objectId(categoryId) })
        .then((category) => {
          resolve(category);
        });
    });
  },

  addCatOffer: (data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { _id: objectId(data.catId) },
          {
            $set: {
              offer: data.offer,
              offer_start: new Date().toString(),
              offer_end: data.enddate,
              offerstatus: true,
            },
          }
        )
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject();
        });
    });
  },

  removeCatOffer: (prId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { _id: objectId(prId) },
          {
            $set: {
              offer: 0,
              offer_start: null,
              offer_end: null,
              offerstatus: false,
            },
          }
        )
        .then((resp) => {
          resolve();
        })
        .catch((err) => {
          reject();
        });
    });
  },

  addProductImage: (product_id, image_path) => {
    console.log("product : " + product_id + " image path : " + image_path);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(product_id) },
          {
            $push: {
              img_path: image_path,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {},
          },
          {
            $lookup: {
              from: collection.USER_COLLECTION,
              localField: "user_data",
              foreignField: "_id",
              as: "user_info",
            },
          },

          {
            $unwind: "$user_info",
          },
          {
            $lookup: {
              from: collection.ADDRESS_COLLECTION,
              localField: "delivery_address",
              foreignField: "_id",
              as: "address",
            },
          },
          {
            $unwind: "$address",
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "products.product_id",
              foreignField: "_id",
              as: "product_info",
            },
          },
          {
            $project: {
              stringDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$date" },
              },
              user_info: 1,
              address: 1,
              status: 1,
              payment_option: 1,
              products: 1,
              deleted: 1,
              dispatched: 1,
              date: 1,
              canceled: 1,
              product_info: 1,
            },
          },
        ])
        .sort({ date: -1 })
        .toArray();
      resolve(orders);
    });
  },

  getOrderDetails: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let prDetail = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $lookup: {
              from: collection.ADDRESS_COLLECTION,
              localField: "delivery_address",
              foreignField: "_id",
              as: "address_info",
            },
          },
          {
            $unwind: "$address_info",
          },
          {
            $unwind: "$address_info.address_collection",
          },
        ])
        .toArray();
      resolve(prDetail[0]);
    });
  },

  productDispatch: (orderId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              dispatched: true,
              status: "dispatched",
              delivery: "pending",
              dispatch_date: Date.now(),
            },
          }
        )
        .then((data) => {
          resolve();
        });
    });
  },

  cancelOrder: (ordId) => {
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(ordId) },
          },
          {
            $project: {
              returnDate: {
                $dateAdd: {
                  startDate: "$date",
                  unit: "day",
                  amount: 8,
                },
              },
              total_amount: 1,
              user_data: 1,
              products: 1,
              date: 1,
              status: 1,
            },
          },
          // {

          //         $merge: collection.ORDER_COLLECTION

          // }
        ])
        .toArray();
      console.log("\nCancel Data...");
      console.log(data);
      if (data[0].status != "pending") {
        let data1 = data[0];
        let nowDate = new Date().toISOString().split("T")[0];
        let lastDate = data1.returnDate.toISOString().split("T")[0];
        if (nowDate > lastDate) {
          resolve({ dateExeeded: true });
        } else {
          let wallet = await db
            .get()
            .collection(collection.WALLET_COLLECTION)
            .findOne({ user_data: objectId(data1.user_data) });
          console.log("TYTYRTYRTRYRRY : " + data1.user_data);
          console.log(wallet);
          if (wallet) {
            await db
              .get()
              .collection(collection.WALLET_COLLECTION)
              .updateOne(
                { user_data: objectId(data1.user_data) },
                {
                  $inc: { amount: data1.total_amount },
                }
              );
            for (i = 0; i < data1.products.length; i++) {
              console.log(data1.products[i].quantity);
              await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne(
                  { _id: objectId(data1.products[i].product_id) },
                  {
                    $inc: { "godown-stock": data1.products[i].quantity },
                  }
                );
            }
            await db
              .get()
              .collection(collection.ORDER_COLLECTION)
              .updateOne(
                { _id: objectId(ordId) },
                {
                  $set: {
                    status: "canceled",
                    canceled: true,
                  },
                }
              );
            resolve({ orderDeleted: true });
          } else {
            await db
              .get()
              .collection(collection.WALLET_COLLECTION)
              .insertOne({
                user_data: data1.user_data,
                amount: data1.total_amount,
              });
            for (i = 0; i < data1.products.length; i++) {
              await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne(
                  { _id: objectId(data1.products[i].product_id) },
                  {
                    $inc: { "$godown-stock": data1.products[i].quantity },
                  }
                );
            }
            await db
              .get()
              .collection(collection.ORDER_COLLECTION)
              .remove({ _id: objectId(ordId) });
            resolve({ orderDeleted: true });
          }
        }
        // console.log('Order Cancel details');
        // console.log(data[0]);
      } else {
        resolve({ orderPending: true });
      }
      //  db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(ordId)}).then((data)=>{
      //     console.log('data in wallet creation');
      //     console.log(data);
      //     if(data.status==='pending'){
      //         resolve('Order Not Placed')
      //     }else{
      //         let nowDate=new Date()

      //         let start_date=data.date.toISOString().split("T")[0]
      //         console.log('Date difference ');
      //         console.log(date+' '+start_date+' '+date-start_date);
      //     }
      // }).catch((err)=>{
      //     reject()
      // })
    });
  },
  getTotalDashbord: () => {
    let dashbordObject = {};
    return new Promise(async (resolve, reject) => {
      dashbordObject.totalOrder = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({})
        .count();
      dashbordObject.totalDelivery = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ dispatched: true })
        .count();
      dashbordObject.totalUsers = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find({})
        .count();
      tot = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { $or: [{ status: "placed" }, { status: "delivered" }] },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$total_amount" },
            },
          },
        ])
        .toArray();
      //    console.log("Sum of numbers : "+JSON.stringify(tot[0].total));
      if (tot.length > 0) {
        dashbordObject.totalRevenue = Math.round(tot[0].total);
      } else {
        dashbordObject.totalRevenue = 0;
      }
      let deemo = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $group: {
              _id: "$status",
              total: { $sum: 1 },
            },
          },
        ])
        .toArray();
      for (i = 0; i < deemo.length; i++) {
        if (deemo[i]._id === "placed") {
          dashbordObject.placedOrder = deemo[i].total;
          console.log("*******");
        }
        if (deemo[i]._id === "pending") {
          dashbordObject.pendingOrder = deemo[i].total;
          console.log("&&&&&&");
        }
      }
      let ordSts = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $group: {
              _id: "$dispatched",
              total: { $sum: 1 },
            },
          },
        ])
        .toArray();
      for (i = 0; i < ordSts.length; i++) {
        if (ordSts[i]._id === false) {
          dashbordObject.orderUnderProcessing = ordSts[i].total;
        }
        if (ordSts[i]._id === true) {
          dashbordObject.oderOutDelivery = ordSts[i].total;
        }
      }

      dashbordObject.deletedOrder = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ deleted: true })
        .count();
      dashbordObject.orderUnderProcessing =
        dashbordObject.orderUnderProcessing -
        dashbordObject.deletedOrder -
        dashbordObject.pendingOrder;
      let paymethod = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $group: {
              _id: "$payment_option",
              total: { $sum: 1 },
            },
          },
        ])
        .toArray();
      for (i = 0; i < paymethod.length; i++) {
        if (paymethod[i]._id === "paypal") {
          dashbordObject.paypal = paymethod[i].total;
        }
        if (paymethod[i]._id === "cod") {
          dashbordObject.cod = paymethod[i].total;
        }
        if (paymethod[i]._id === "razor") {
          dashbordObject.razor = paymethod[i].total;
        }
      }
      resolve(dashbordObject);
    });
  },
  getYearSales: () => {
    return new Promise(async (resolve, reject) => {
      let month = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { status: "placed" },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              totalAmount: { $sum: "$total_amount" },
            },
          },
        ])
        .toArray();
      console.log("The Sales Report : " + JSON.stringify(month));
      resolve();
    });
  },

  getMonthSales: () => {
    return new Promise(async (resolve, reject) => {
      let month = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { status: "placed" },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%m", date: "$date" } },
              totalAmount: { $sum: "$total_amount" },
            },
          },
        ])
        .toArray();
      console.log("The Sales Report : " + JSON.stringify(month));
      resolve(month);
    });
  },

  getDaySales: () => {
    return new Promise(async (resolve, reject) => {
      let month = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { status: "placed" },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              totalAmount: { $sum: "$total_amount" },
            },
          },
        ])
        .toArray();
      console.log("The Sales Report : " + JSON.stringify(month));
      resolve(month);
    });
  },
  addBanner: (img) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.BANNER_COLLECTION)
        .insertOne({ img_path: img })
        .then((data) => {
          resolve();
        })
        .catch((err) => {
          reject();
        });
    });
  },
  getBanner: () => {
    return new Promise(async (resolve, reject) => {
      let banner = await db
        .get()
        .collection(collection.BANNER_COLLECTION)
        .find()
        .toArray();
      if (banner) {
        resolve(banner);
      } else {
        reject();
      }
    });
  },
  deleteBanner: (bannerId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.BANNER_COLLECTION)
        .remove({ _id: objectId(bannerId) })
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  },
  getCoupons: () => {
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray();
      resolve(data);
    });
  },
  addCoupon: (data) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.COUPON_COLLECTION).insertOne({
        coupon_code: data.couponcode,
        offer: data.offer,
        start_date: new Date(),
        end_date: data.enddate,
        users: [],
      });
      resolve();
    });
  },
  removeCoupon: (coupId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .remove({ _id: objectId(coupId) })
        .then(() => {
          resolve();
        });
    });
  },
  getCoupon: () => {
    return new Promise(async (resolve, reject) => {
      let couponCollection = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray();
      resolve(couponCollection);
    });
  },
  checkCoupon: (coupon) => {
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .aggregate([
          {
            $match: { coupon_code: coupon },
          },
        ])
        .toArray();
      if (data.length > 0) {
        resolve(data[0]);
      } else {
        resolve(false);
      }
    });
  },
  couponUsed: (couponId, userId, offer) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .updateOne(
          { _id: objectId(couponId) },
          {
            $push: {
              users: userId,
            },
          }
        )
        .then(async () => {
          await db
            .get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user_data: objectId(userId) },
              {
                $set: {
                  coupon: 1 - parseInt(offer) / 100,
                },
              }
            );
          resolve();
        });
    });
  },
  validateOffers: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      let category = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray();
      for (i = 0; i < products.length; i++) {
        if (products[i].offer != 0) {
          let nowDate = new Date().toISOString().split("T")[0];

          if (nowDate > products[i].end_date) {
            await db
              .get()
              .collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                { _id: objectId(products[i]._id) },
                {
                  $set: {
                    offer: 0,
                    offer_end: null,
                    offer_start: null,
                    offerstatus:false
                  },
                }
              );
          }
        }
      }
      for (i = 0; i < category.length; i++) {
        if (category[i].offer != 0) {
          let nowDate = new Date().toISOString().split("T")[0];

          if (nowDate > category[i].offer_end) {
            await db
              .get()
              .collection(collection.CATEGORY_COLLECTION)
              .updateOne(
                { _id: objectId(category[i]._id) },
                {
                  $set: {
                    offer: 0,
                    offer_end: null,
                    offer_start: null,
                    offerstatus:false
                  },
                }
              );
          }
        }
      }

      resolve();
    });
  },
  addFeedback: (userId, feedback) => {
    console.log("feed back");
    return new Promise(async (resolve, reject) => {
      let userPresent = await db
        .get()
        .collection(collection.FEEDBACK_COLLECTION)
        .findOne({ user_data: objectId(userId) });
      if (userPresent) {
        await db
          .get()
          .collection(collection.FEEDBACK_COLLECTION)
          .updateOne(
            { user_data: objectId(userId) },
            {
              $push: {
                feedbacks: feedback,
              },
            }
          )
          .then(async () => {
            await db
              .get()
              .collection(collection.ORDER_COLLECTION)
              .updateMany(
                { user_data: objectId(userId), delivery: "pending" },
                {
                  $set: {
                    delivery: "delivered",
                    status: "Delivered",
                  },
                }
              );
            resolve();
          });
      } else {
        await db
          .get()
          .collection(collection.FEEDBACK_COLLECTION)
          .insertOne({
            user_data: objectId(userId),
            feedbacks: [feedback],
          })
          .then(async () => {
            await db
              .get()
              .collection(collection.ORDER_COLLECTION)
              .updateOne(
                { user_data: objectId(userId), delivery: "pending" },
                {
                  $set: {
                    delivery: "delivered",
                    status: "Delivered",
                  },
                }
              );
            resolve();
          });
      }
    });
  },
  getFeedback: () => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.FEEDBACK_COLLECTION)
        .aggregate([
          {
            $match: {},
          },
          {
            $lookup: {
              from: collection.USER_COLLECTION,
              localField: "user_data",
              foreignField: "_id",
              as: "user_info",
            },
          },
          {
            $unwind: "$user_info",
          },
        ])
        .toArray()
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          reject();
        });
    });
  },
  getYearlyData: () => {
    return new Promise(async (resolve, reject) => {
      thisYear = new Date().getFullYear();
      console.log(thisYear);
      let yearData = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $project: {
              year: { $year: "$date" },
              user_data: 1,
              total_amount: 1,
              status: 1,
              payment_option: 1,
            },
          },
          {
            $group: {
              _id: "$year",
              totalSaleAmount: { $sum: "$total_amount" },
            },
          },
        ])
        .toArray();
      console.log(yearData);
      resolve(yearData);
    });
  },
  getMonthlyData: () => {
    return new Promise(async (resolve, reject) => {
      thisYear = new Date().getMonth();
      console.log(thisYear);
      let monthData = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $project: {
              month: { $month: "$date" },
              total_amount: 1,
            },
          },
          {
            $addFields: {
              month: {
                $let: {
                  vars: {
                    monthsInString: [
                      ,
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ],
                  },
                  in: {
                    $arrayElemAt: ["$$monthsInString", "$month"],
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: "$month",
              totalSaleAmount: { $sum: "$total_amount" },
            },
          },
        ])
        .toArray();
      console.log(monthData);
      resolve(monthData);
    });
  },
  getDailyData: () => {
    return new Promise(async (resolve, reject) => {
      thisYear = new Date().getMonth();
      console.log(thisYear);
      let monthData = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $project: {
              stringDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$date" },
              },
              total_amount: 1,
              date: 1,
            },
          },
          {
            $group: {
              _id: "$stringDate",
              totalSaleAmount: { $sum: "$total_amount" },
            },
          },
        ])
        .toArray();
      console.log(monthData);
      resolve(monthData);
    });
  },
  getMessage: () => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.MESSAGE_COLLECTION)
        .aggregate([
          {
            $match: {},
          },
          {
            $lookup: {
              from: collection.USER_COLLECTION,
              localField: "user_data",
              foreignField: "_id",
              as: "user_info",
            },
          },
          {
            $unwind: "$user_info",
          },
        ])
        .toArray()
        .then((data) => {
          resolve(data);
        });
    });
  },
  getDateLimit: (sdate, eDate) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $lookup: {
              from: collection.USER_COLLECTION,
              localField: "user_data",
              foreignField: "_id",
              as: "user_info",
            },
          },
          {
            $unwind: "$user_info",
          },
          {
            $project: {
              ordDate: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              user_info: 1,
              total_amount: { $round: ["$total_amount", 2] },
              status: 1,
              payment_option: 1,
              products: 1,
            },
          },
          {
            $match: {
              $and: [{ ordDate: { $gt: sdate } }, { ordDate: { $lt: eDate } }],
            },
          },
        ])
        .toArray();
      console.log(orders);
      resolve(orders);
    });
  },
  getMostSellin: () => {
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $project: {
              products: 1,
            },
          },
          {
            $unwind: "$products",
          },
          {
            $group: { _id: "$products.product_id", prCount: { $sum: 1 } },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "_id",
              foreignField: "_id",
              as: "productInfo",
            },
          },
          {
            $unwind: "$productInfo",
          },
          {
            $sort: { prCount: -1 },
          },
          {
            $limit: 3,
          },
          {
            $project: {
              prCount: 1,
              "productInfo.title": 1,
              "productInfo.price": 1,
              "productInfo.img_path": 1,
            },
          },
        ])
        .toArray();
      resolve(data);
    });
  },
  getProductsPrice: (startPrice) => {
    if (startPrice >= 200) {
      return new Promise(async (resolve, reject) => {
        let products = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .aggregate([
            {
              $match: { price: { $gt: startPrice } },
            },
            {
              $lookup: {
                from: collection.CATEGORY_COLLECTION,
                localField: "category",
                foreignField: "category-name",
                as: "categoryInfo",
              },
            },
            {
              $unwind: "$categoryInfo",
            },
            {
              $project: {
                title: 1,
                category: 1,
                description: 1,
                "storage-spec": 1,
                price: 1,
                img_path: 1,
                "categoryInfo.offer": 1,
                actualPrice: {
                  $subtract: [
                    "$price",
                    {
                      $multiply: [
                        "$price",
                        { $divide: [{ $toInt: "$offer" }, 100] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                title: 1,
                category: 1,
                description: 1,
                "storage-spec": 1,
                price: 1,
                img_path: 1,
                actualPrice: 1,
                finalPrice: {
                  $subtract: [
                    "$actualPrice",
                    {
                      $multiply: [
                        "$actualPrice",
                        { $divide: [{ $toInt: "$categoryInfo.offer" }, 100] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                title: 1,
                category: 1,
                description: 1,
                "storage-spec": 1,
                price: 1,
                img_path: 1,
                actualPrice: 1,
                "categoryInfo.offer": 1,
                finalPrice: 1,
                discount: {
                  $round: [{ $subtract: ["$price", "$finalPrice"] }, 2],
                },
              },
            },
          ])
          .toArray();
        resolve(products);
      });
    } else {
      let endPrice = startPrice + 50;
      console.log('products : '+endPrice);
      return new Promise(async (resolve, reject) => {
        let products = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .aggregate([
            {
              $match: {
                $and: [
                  { price: { $gt: startPrice } },
                  { price: { $lt: endPrice } },
                ],
              },
            },
            {
              $lookup: {
                from: collection.CATEGORY_COLLECTION,
                localField: "category",
                foreignField: "category-name",
                as: "categoryInfo",
              },
            },
            {
              $unwind: "$categoryInfo",
            },
            {
              $project: {
                title: 1,
                category: 1,
                description: 1,
                "storage-spec": 1,
                price: 1,
                img_path: 1,
                "categoryInfo.offer": 1,
                actualPrice: {
                  $subtract: [
                    "$price",
                    {
                      $multiply: [
                        "$price",
                        { $divide: [{ $toInt: "$offer" }, 100] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                title: 1,
                category: 1,
                description: 1,
                "storage-spec": 1,
                price: 1,
                img_path: 1,
                actualPrice: 1,
                finalPrice: {
                  $subtract: [
                    "$actualPrice",
                    {
                      $multiply: [
                        "$actualPrice",
                        { $divide: [{ $toInt: "$categoryInfo.offer" }, 100] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                title: 1,
                category: 1,
                description: 1,
                "storage-spec": 1,
                price: 1,
                img_path: 1,
                actualPrice: 1,
                "categoryInfo.offer": 1,
                finalPrice: 1,
                discount: {
                  $round: [{ $subtract: ["$price", "$finalPrice"] }, 2],
                },
              },
            },
          ])
          .toArray();
        resolve(products);
      });
    }
  },
  getTodayData:()=>{
    return new Promise(async(resolve,reject)=>{
      let data=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match:{
          status:'placed',
          }
        },
        {
          $sort : { date : -1}
        },
        {
          $limit : 5
        }
      ]).toArray()

      resolve(data)
    })
  }
};
