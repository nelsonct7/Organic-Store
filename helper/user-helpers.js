var db = require('../config/connection');
const bcrypt = require('bcrypt');
const {promise, reject} = require('bcrypt/promises');
const async = require('hbs/lib/async');
const {response} = require('../app');
const newdate = require('date-and-time')
const Razorpay = require('razorpay');
const paypal = require('paypal-rest-sdk');
var objectId = require('mongodb').ObjectId
var collection = require('../config/collections');
const { resolve } = require('node:path');

var instance = new Razorpay({
    key_id: process.env.rz_key_id,
    key_secret: process.env.rz_key_secret,
  });

  paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.pay_client_id,
    'client_secret': process.env.pay_client_secret
  });


module.exports = {
    doSignup: (userData) => {

        return new Promise(async (resolve, reject) => {
            userData.user_password = await bcrypt.hash(userData.user_password, 10)
            userData.status = true
            userData.deleted = false
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data)
            })

        })


    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({user_email: userData.user_email})
            let loginStatus = false;
            let response = {}

            if (user && user.status == true && user.deleted == false) {
                // response.user_mobile=user.user_mobile
                // response.user_name=user.user_name
                response = user
                bcrypt.compare(userData.user_password, user.user_password).then((stat) => {
                    if (stat) {
                        console.log("Login Success...");
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("Login Failed...");
                        resolve({status: false})
                    }
                })

            } else {
                console.log("Login Failed...");
                resolve({status: false})
            }
        })
    },
    addToCart: (proId, userId) => {
        let prodObj = {
            product_id: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user_data: objectId(userId)})
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.product_id == proId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({
                        user_data: objectId(userId),
                        'products.product_id': objectId(proId)
                    }, {
                        $inc: {
                            'products.$.quantity': 1
                        }
                    }).then((response) => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({
                        user_data: objectId(userId)
                    }, {
                        $push: {
                            products: prodObj
                        },
                        $set:{
                            coupon:1
                        }
                    }).then((response) => {
                        resolve()
                    })
                }

            } else {
                let cartObj = {
                    user_data: objectId(userId),
                    products: [prodObj],
                    coupon:1
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })

    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: {
                        user_data: objectId(userId)
                    }

                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        product_id: '$products.product_id',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'product_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        product_id: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                },
                {
                    $lookup: {
                        from: collection.CATEGORY_COLLECTION,
                        localField: 'product.category',
                        foreignField: 'category-name',
                        as: 'categoryInfo'
                    }  
                },{
                    $unwind:'$categoryInfo'
                },
                {
                    $project:{
                        product_id: 1,
                        quantity: 1,
                        product:1,
                        categoryInfo:1,
                        productprice:{$subtract:['$product.price',{$multiply:['$product.price',{$divide:[{$toInt:'$product.offer'},100]}]}]},
                        actualPrice:{$subtract:['$productprice',{$multiply:['$productprice',{$divide:[{$toInt:'$categoryInfo.offer'},100]}]}]}
                    }
                },
                {
                    $project:{
                        product_id: 1,
                        quantity: 1,
                        product:1,
                        productprice:1,
                        actualPrice:{$subtract:['$productprice',{$multiply:['$productprice',{$divide:[{$toInt:'$categoryInfo.offer'},100]}]}]}
                    }
                }
            ]).toArray()
             console.log("\ncart Products : "+JSON.stringify(cartItems));
            resolve(cartItems)
        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user_data: objectId(userId)})
            if (cart) {
                count = cart.products.length
                console.log("\nCount in helper : " + count);
            }
            resolve(count) 
        })
    },
    updateCartQuantity: (details) => {
        if (details.count == -1 && details.quantity == 1) {
            return new Promise((resolve, reject) => {
                db.get().collection(collection.CART_COLLECTION).updateOne({
                    _id: objectId(details.cart),
                    'products.product_id': objectId(details.product)
                }, {
                    $pull: {
                        products: {
                            product_id: objectId(details.product)
                        }
                    }
                }).then((response) => {
                    resolve({itemRemoved: true})
                })
            })
        } else {
            return new Promise((resolve, reject) => {
                details.count = parseInt(details.count)
                db.get().collection(collection.CART_COLLECTION).updateOne({
                    _id: objectId(details.cart),
                    'products.product_id': objectId(details.product)
                }, {
                    $inc: {
                        'products.$.quantity': details.count
                    }
                }).then((response) => {
                    resolve({status: true})
                })

            })
        }

    },

    removeCartItem: (prdId, usrId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({
                user_data: objectId(usrId),
                'products.product_id': objectId(prdId)
            }, {
                $pull: {
                    products: {
                        product_id: objectId(prdId)
                    }
                }
            }).then((response) => {
                resolve(itemRemoved = true)
            })
        })

    },

    findCartTotal: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: {
                        user_data: objectId(userId)
                    }

                },
                 {
                     $unwind: '$products'
                 },
                 {
                     $project: {
                        product_id: '$products.product_id',
                        quantity: '$products.quantity',
                        coupon:'$coupon'
                     }
                 },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'product_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        product_id: 1,
                        quantity: 1,
                        coupon:1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                },
                {
                    $lookup:{
                        from:collection.CATEGORY_COLLECTION,
                        localField:'product.category',
                        foreignField:'category-name',
                        as:'categoryInfo'
                    }
                },
                {
                    $unwind:'$categoryInfo'
                },
                {
                    $project:{
                        product_id: 1,
                        quantity: 1,
                        product:1,
                        coupon:1,
                        cato:'$categoryInfo.offer',
                        productprice:{$subtract:['$product.price',{$multiply:['$product.price',{$divide:[{$toInt:'$product.offer'},100]}]}]},
                    }
                },
                {
                    $project:{
                        product_id: 1,
                        quantity: 1,
                        product:1,
                        categoryInfo:1,
                        productprice:1,
                        coupon:1,
                        actualPrice:{$subtract:['$productprice',{$multiply:['$productprice',{$divide:[{$toInt:'$cato'},100]}]}]}
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $multiply: ['$quantity', '$actualPrice','$coupon']
                            }
                        }

                    }
                }
            ]).toArray()

            //console.log("\ncart : "+JSON.stringify(total));
            if(total.length>0){
                resolve(total[0].total)
                // resolve()
            }else{
                resolve(0)
            }
            
        })
    },
    // User router

    getAllUser: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)

        })

    },
    getUserDetails: (usrId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({_id: objectId(usrId)}).then((response) => {
                resolve(response)
            })
        })

    },
    updateUser: (usrId, user) => {
        console.log("Control reached.... " + user.status);
        if (user.status == 'false') {
            console.log("Control reached....");
            user.status = false
        } else {
            user.status = true
        }
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({
                _id: objectId(usrId)
            }, {
                $set: {
                    status: user.status
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    deleteUser: (usrId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({
                _id: objectId(usrId)
            }, {
                $set: {

                    deleted: true,
                    status: false
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    
    doAdminLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({og_admin: adminData.admin_field})
            let loginStatus = false;
            let response = {}
            console.log(admin);
            if (admin) { // console.log("$$$$$$$$$$$$"+adminData.psd);
                if (adminData.admin_password == admin.admin_password) { // console.log("Login Success...");
                    response.status = true
                    response.admin = admin
                    resolve(response)
                } else {
                    console.log("Login Failed...");
                    resolve({status: false})
                }


            } else {
                console.log("Login Failed...");
                resolve({status: false})
            }
        })
    },
    userPresent: (usermail) => {
        return new Promise(async (resolve, reject) => {
            let admin = await db.get().collection(collection.USER_COLLECTION).findOne({user_email: usermail})
            let response = {}
            console.log('Data : '+admin);
            if (admin) {
                console.log("sign up false...");
                response.status = true
                resolve(response)
            } else {
                console.log("sign up true...");
                resolve({status: false})
            }
        })


    },

    updateAddress: (address) => {
        let userId = address.userId
        let user_address = {
            first_name: address.first_name,
            second_name: address.second_name,
            house_name: address.house_name,
            street: address.street,
            town: address.town,
            pin: parseInt(address.pin),
            state: address.state,
            country: address.country
        }

        return new Promise(async (resolve, reject) => {
                await db.get().collection(collection.ADDRESS_COLLECTION).insertOne({user_data: objectId(userId), address_collection: user_address}).then((response) => {
                    resolve(response)
                })
           
        })
    },

    getAllAddressUser:(usr_id)=>{
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).find({user_data: objectId(usr_id)}).toArray()
            //console.log(address);
            if(address.length>0){
                resolve(address)
            }else{
                resolve(false)
            }
            
        })
    }, 

    getUserAddress: (adr_id) => {
        console.log("\nAddres Id : " + adr_id);
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({_id: objectId(adr_id)})
            // console.log(JSON.stringify(address.address_collection[0]));
            resolve(address)
        })


    },


    updateUserAddress:(data)=>{
        let adrId=data.adrId
        let user_address = {
            first_name: data.first_name,
            second_name: data.second_name,
            house_name: data.house_name,
            street: data.street,
            town: data.town,
            pin: parseInt(data.pin),
            state: data.state,
            country: data.country
        }
        return new Promise(async (resolve,reject)=>{
            await db.get().collection(collection.ADDRESS_COLLECTION).updateOne({_id:objectId(adrId)},{
                $set:{address_collection: user_address}
            }).then((data)=>{
                resolve()
            })
        })
        

    },

    getCartProductsList: (user_id) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user_data: objectId(user_id)})
            //console.log("product list " + cart.products);
            resolve(cart.products)
        })
    },

    decreaseProducts:(prList)=>{
        console.log("\ndfdffs");
        console.log(prList);
        return new Promise((resolve,reject)=>{
            prList.map(async(value)=>{
                await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(value.product_id)},{
                   
                        $inc:{'godown-stock':-value.quantity}
                    
                })
            })
            resolve()
        })
        console.log('\n\nLists : ');
            console.log(prList);
    },
    removeCart: (user_id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CART_COLLECTION).updateOne({
                user_data: objectId(user_id)
            }, {
                $set: {

                    products: [],
                    coupon:1
                }
            })
            resolve()
        })
    },
    addToOrder: (user_id, address_id, total, payment_option, pr_List) => {
        let status = 'pending' 
        if(payment_option==='cod' || payment_option==='wallet'){
            status='placed'
        }else{
            status='pending'
        }
        let orderObj = {
            user_data: objectId(user_id),
            delivery_address: address_id,
            total_amount: total,
            status: status,
            payment_option: payment_option,
            products: pr_List,
            deleted: false,
            dispatched: false,
            date: new Date()
        }
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((data) => {
                resolve(data)
            })
        })
    },
    getOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        user_data: objectId(userId),
                        deleted: false
                        
                    }
                },

                {
                    $lookup: {
                        from: collection.ADDRESS_COLLECTION,
                        localField: 'delivery_address',
                        foreignField: '_id',
                        as: 'address'
                    }
                },
                {
                    $unwind: '$address'

                },
                {
                    $lookup: {
                        from: collection.USER_COLLECTION,
                        localField: 'user_data',
                        foreignField: '_id',
                        as: 'userinfo'
                    }
                }, {
                    $unwind: '$userinfo'
                },
                {
                    $project: {
                        total_amount:{$round :['$total_amount',3]},
                        status: 1,
                        payment_option: 1,
                        dispatched: 1,
                        date: 1,
                        address: 1,
                        userinfo: 1,
                        deleted: 1,
                        adressIndex: 1,
                        stringDate:{$dateToString: { format: "%d-%m-%Y", date: "$date" }},
                        canceled:1
                    }
                }

            ]).sort({date:-1}).toArray()
            //console.log("\nOrders : "+JSON.stringify(orders));
            resolve(orders)
            // let orders=await db.get().collection(collection.ORDER_COLLECTION).find({user_data:userId}).toArray()
            // console.log("\nOrders : "+JSON.stringify(orders));
            // resolve(orders)

            //     let orders=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            //         {
            //             $match:{user_data:objectId(userId)}

            //         },
            //         // {
            //         //     $unwind:'$products'
            //         // },
            //         // {
            //         //     $project:{
            //         //         product_id:'$products.product_id',
            //         //         quantity:'$products.quantity'
            //         //     }
            //         // },
            //         // {
            //         //     $lookup:{
            //         //         from:collection.PRODUCT_COLLECTION,
            //         //         localField:'product_id',
            //         //         foreignField:'_id',
            //         //         as:'product'
            //         //     }
            //         // },
            //         // {
            //         //     $project:{
            //         //         product_id:1,
            //         //         quantity:1,
            //         //         product:{$arrayElemAt:['$product',0]}
            //         //     }
            //         // },
            //         // {

            //         //     $group:{
            //         //         _id:null,
            //         //         total:{$sum:{$multiply:['$quantity','$product.price']}}

            //         //     }
            //         // }
            //     ]).toArray()

            //     console.log("\norders : "+JSON.stringify(orders));
            //     resolve(orders[0])
        })


    },

    removeOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({
                _id: objectId(orderId)
            }, {
                $set: {
                    deleted: true,
                    status:'deleted'
                }
            })
            resolve()
        })
    },

    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectId(orderId),
                        deleted: false
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        product_id: '$products.product_id'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'product_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $unwind: '$product'
                }, {
                    $project: {
                        product: 1
                    }
                }


            ]).toArray()
            // console.log("\nproducts : "+JSON.stringify(products[0]));
            resolve(products)
        })
    },
    getAllOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        user_data: objectId(userId)
                    }
                },
                {
                    $lookup: {
                        from: collection.USER_COLLECTION,
                        localField: 'user_data',
                        foreignField: '_id',
                        as: 'user_info'
                    }
                },
                {
                    $unwind: '$user_info'
                },
                {
                    $lookup: {
                        from: collection.ADDRESS_COLLECTION,
                        localField: 'delivery_address',
                        foreignField: '_id',
                        as: 'address'
                    }
                }, {
                    $unwind: '$address'
                },
                // {
                //     $unwind:'$products'
                // },
                {
                    $project:{
                        products:1,
                        address:1,
                        user_info:1,
                        total_amount:{$round :['$total_amount',3]},
                        status:1,
                        payment_option:1,
                        stringDate:{$dateToString: { format: "%d-%m-%Y", date: "$date" }},
                        date:1
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.product_id',
                        foreignField: '_id',
                        as: 'productDetail'
                    }
                }
                // {
                //     $project:{
                //         stringDate:{$dateToString: { format: "%Y-%m-%d", date: "$date" }}
                //     }
                    
                // }


            ]).sort({date:-1}).toArray()
          console.log("\nOrder details : "+JSON.stringify(orders[0]));
            resolve(orders)
        })
    },


    getDeliveryStatus:(usrId)=>{
        return new Promise(async(resolve,reject)=>{
            let deliveryPending=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{user_data:objectId(usrId),delivery:'pending'}
                },
                // {
                //  $project:{
                //     returnDate:{
                //         $dateAdd:
                //             {
                //             startDate: "$dispatch_date",
                //             unit: "day",
                //             amount: 2
                //             }
                //  }   
                // }
                // }
                {
                    $project:{
                        _id:1,
                    }
                }
            ]).toArray()
            console.log('\n Delivery pending orders : '+JSON.stringify(deliveryPending));
            
            //.find({user_data:objectId(usrId),delivery:'pending'})
            if(deliveryPending){
                resolve(deliveryPending)
            }else{
                resolve(false)
            }
        })
    },

    updateProfile:(usrId,data)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(usrId)},{
                $set:{
                    user_name:data.user_name,
                    user_email:data.user_email,
                    user_mobile:data.user_mobile
                }
            }).then((result)=>{
                resolve(result)
            })
        })
    }, 

    updatePassword:(psdData)=>{
        
        return new Promise(async (resolve,reject)=>{
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({user_email: psdData.user_email})
            let response = {}
            if (user && user.status == true && user.deleted == false) {
                response = user
                bcrypt.compare(psdData.user_password, user.user_password).then(async (stat) => {
                    if (stat) {
                        let psd=await bcrypt.hash(psdData.new_password, 10)
                        console.log("Password Matched...");
                        await db.get().collection(collection.USER_COLLECTION).updateOne({user_email: psdData.user_email},{
                            $set:{
                                user_password : psd
                            }
                        }).then((data)=>{
                            console.log('\nPassword data at helper : '+JSON.stringify(data));
                        })
                        
                        response.status = true
                        response.msg='Password Changed'
                        resolve(response)
                    } else {
                        console.log("password Miss match");
                        response.status = false
                        response.msg='Password Missmatch'
                        resolve(response)
                    }
                })

            } else {
                console.log("emailnot present");
                response.status = false
                response.msg='Email Missmatch'
                resolve(response)
            }
        })
    },


    generateRazor:(orderId,total)=>{
        console.log('\nTotal : '+orderId);
        return new Promise((resolve,reject)=>{
            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                  if(err){
                      //console.log('\n Error : '+JSON.stringify(err));
                      reject(err)
                  }else{
                    //console.log("\n***********New Order : "+JSON.stringify(order));
                    resolve(order)
                  }

              })
        })
        
    },

    verifyPayment: (data)=>{

            
            return new Promise((resolve,reject)=>{
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256','aVa1964TkOSnoCdw15DjRTeM')
            hmac.update(data.resp.razorpay_order_id+'|'+data.resp.razorpay_payment_id)
            hmac = hmac.digest('hex')
            if(hmac==data.resp.razorpay_signature){
            resolve()
            }else{
            reject()
            }
            
            })
    },

    changeStatus:(ordId)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(ordId)},{
                $set:{status:'placed'}
            }).then(()=>{
                resolve()
            })
        })
    },

    generatePaypal:(orderId,total,user)=>{
        return new Promise((resolve,reject)=>{
            var create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/paypallSuccess",
                    "cancel_url": "http://localhost:3000/login"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "item",
                            "sku": "item",
                            "price": total,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": total
                    },
                    "description": "This is the payment description."
                }]
            };
             
             
            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    // throw error;
                    console.log("ERERERRE"+error);
                    reject(error)
                    
                } else {
                    console.log("Create Payment Response");
                    console.log(payment);
                    resolve(payment)
                }
            }); 
        })
    },
    deleteProfile:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            await db.get().collection(collection.CART_COLLECTION).deleteMany({user_data:objectId(userId)}).then(async ()=>{
                await db.get().collection(collection.ADDRESS_COLLECTION).deleteMany({user_data:objectId(userId)}).then(async ()=>{
                    await db.get().collection(collection.USER_COLLECTION).remove({_id:objectId(userId)}).then(async ()=>{
                        await db.get().collection(collection.ORDER_COLLECTION).deleteMany({user_data:objectId(userId)}).then(()=>{
                            resolve()
                        })
                    })
                })
            }).catch(()=>{
                reject()
            })
        })
    },
    getUserMessages:(usrId)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.MESSAGE_COLLECTION).findOne({user_data:objectId(usrId)}).then((msg)=>{
                resolve(msg)
            }).catch((err)=>{
                reject(err)
            })
        })
    },
    getValetAmount:(usrId)=>{
        return new Promise(async(resolve,reject)=>{
            let balance=0;
            balance=await db.get().collection(collection.WALLET_COLLECTION).findOne({user_data:objectId(usrId)})
            if(balance){
                resolve(balance.amount)
            }else{
                resolve(0)
            }
        })
    },
    updateWallet:(wAmount,usrId)=>{
        return new Promise(async (resolve,reject)=>{
            await db.get().collection(collection.WALLET_COLLECTION).updateOne({user_data:objectId(usrId)},{
                $set:{
                    amount:wAmount
                }
            }).then(()=>{
                resolve()
            })
        })
    },

    addMessage:(message,userId)=>{

        return new Promise(async (resolve,reject)=>{
            let userPresent=await db.get().collection(collection.MESSAGE_COLLECTION).find({user_data:objectId(userId)}).toArray()
            console.log('/nrtrtrtrtrrtr');
            console.log(userPresent);
            if(userPresent.length>0){
                await db.get().collection(collection.MESSAGE_COLLECTION).updateOne({user_data:objectId(userId)},{
                    $set:{
                        adminMessage:[],
                        adminView:false  
                    },
                    $push:{
                        userMessage:message.message
                    }
                }).then((data)=>{
                    resolve()
                })

            }else{
                console.log('\nfgdgdfgfdgdfgdgd');
                await db.get().collection(collection.MESSAGE_COLLECTION).insertOne({user_data:objectId(userId),
                userMessage:[message.message],
                adminMessage:[],
                adminView:false
                }).then((data)=>{
                    resolve()
                })
            }
        })
    }


}
