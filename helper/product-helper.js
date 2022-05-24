
const { reject } = require('bcrypt/promises');
const { response } = require('express');
var db=require('../config/connection');
var collection=require('../config/collections')
var objectId=require('mongodb').ObjectId
const multer  = require('multer');
const async = require('hbs/lib/async');
const { json } = require('body-parser');
const upload = multer({ dest: 'uploads/' })


module.exports={
    addProduct:(product,callback)=>{
       product.price=parseInt(product.price)
       product.date=new Date().toDateString()
       product.deleted=false
       db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            callback(data)
        })

    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({deleted:false,status:'Available'}).toArray()
            if(products){
                resolve(products)
            }else{
                reject()
            }
            
        })
    },
    getAllProductsAdmin:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({deleted:false}).toArray()
            resolve(products)
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).remove({_id:objectId(proId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })

    },
    updateProduct:(proId,proDetails)=>{
        if(proDetails.deleted=="false"){
            proDetails.deleted=false
        }else{
            proDetails.deleted=true
        }
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
                $set:{
                    title:proDetails.title,
                    category:proDetails.category,
                    description:proDetails.description,
                    "storage-spec":proDetails.storagespec,
                    
                    price:proDetails.price,
                    "godown-stock":proDetails.godownstock,
                    status:proDetails.status,
                    date:new Date().toDateString(),
                    deleted:proDetails.deleted
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    getCategory :()=>{
        return new Promise(async(resolve,reject)=>{
            let category=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })

    },
    addCategory:(category,callback)=>{
        category.img_path=false
        category.deleted=false
        db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data)=>{
            
            callback(data)
        })
    },
    updateCategoryImage:(category_id,image_path)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(category_id)},{
                $set:{
                    img_path:image_path
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    getAllCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let categories=await db.get().collection(collection.CATEGORY_COLLECTION).find({deleted:false}).toArray()
            resolve(categories)
        })
    },
    deleteCategory:(CategoryId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(CategoryId)},
            {
            $set:{
            
                deleted:true
            }
            }).then((response)=>{
                resolve()
            })
        })
    },
    updateCategory:(categoryId,category)=>{

        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(categoryId)},
            {
            $set:{
                "category-name":category.categoryname,
                "category-description":category.categorydescription,
            }
            }).then((response)=>{
                resolve()
            })
        })
    },
    getCategoryDetails:(categoryId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(categoryId)}).then((category)=>{
                resolve(category)
            })
        })

    },

    addProductImage:(product_id,image_path)=>{
        console.log("product : "+product_id+" image path : "+image_path);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(product_id)},{
                $push:{
                    img_path:image_path
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    getAllOrders:()=>{
        return new Promise(async (resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{

                    }
                },
                {
                    $lookup:{
                        from:collection.USER_COLLECTION,
                        localField:'user_data',
                        foreignField:'_id',
                        as:'user_info'
                    }
                },
               
                {
                    $unwind:'$user_info'
                },
                {
                    $lookup:{
                        from:collection.ADDRESS_COLLECTION,
                        localField:'delivery_address',
                        foreignField:'_id',
                        as:'address'
                    }
                },
                {
                    $unwind:'$address'
                },
                {
                    $project:{
                        stringDate:{$dateToString: { format: "%d-%m-%Y", date: "$date" }} ,
                        user_info:1,
                        address:1,
                        status:1,
                        payment_option:1,
                        products:1,
                        deleted:1,
                        dispatched:1 
                        
                    }
                }

            ]).sort({stringDate:-1}).toArray()
            console.log("\nOrder details : "+JSON.stringify(orders[0]));
            resolve(orders)
        })
    },

    getAllOrdersJson:()=>{
        return new Promise(async (resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{

                    }
                },
                {
                    $lookup:{
                        from:collection.USER_COLLECTION,
                        localField:'user_data',
                        foreignField:'_id',
                        as:'user_info'
                    }
                },
               
                {
                    $unwind:'$user_info'
                },
                {
                    $lookup:{
                        from:collection.ADDRESS_COLLECTION,
                        localField:'delivery_address',
                        foreignField:'_id',
                        as:'address'
                    }
                },
                {
                    $unwind:'$address'
                },
                {
                    $project:{
                        stringDate:{$dateToString: { format: "%d-%m-%Y", date: "$date" }} ,
                        user_info:1,
                        address:1,
                        status:1,
                        payment_option:1,
                        products:1,
                        deleted:1,
                        dispatched:1 ,
                        date:1
                        
                    }
                }

            ]).sort({date:-1}).toArray()
            console.log(orders);
            resolve(orders)
        })
    },

    getOrderDetails:(orderId)=>{
        //console.log("\nOrder Id : "+orderId);
        return new Promise(async (resolve,reject)=>{
            let prDetail=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $lookup:{
                        from:collection.ADDRESS_COLLECTION,
                        localField:'delivery_address',
                        foreignField:'_id',
                        as:'address_info'
                    }
                },
                {
                    $unwind:'$address_info'
                },
                {
                    $unwind:'$address_info.address_collection'
                }

            ]).toArray()
            //console.log("\nUser Edit Data : "+JSON.stringify(prDetail[0]));
            resolve(prDetail[0])

        })
    },

    productDispatch:(orderId)=>{
        return new Promise(async (resolve,reject)=>{
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
            {
                $set:{
                    dispatched:true
                }
                
            }).then((data)=>{
                resolve()
            })
        })
    },
    getTotalDashbord:()=>{
        let dashbordObject={}
        return new Promise(async(resolve,reject)=>{
            dashbordObject.totalOrder=await db.get().collection(collection.ORDER_COLLECTION).find({}).count()
            dashbordObject.totalDelivery=await db.get().collection(collection.ORDER_COLLECTION).find({dispatched:true}).count()
            dashbordObject.totalUsers=await db.get().collection(collection.USER_COLLECTION).find({}).count()
            tot=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $group:{
                            _id:null,
                            total:{$sum:'$total_amount'}
                        }
                        
                    }
                   ]).toArray()
                //    console.log("Sum of numbers : "+JSON.stringify(tot[0].total));
            if(tot.length>0){
                dashbordObject.totalRevenue=tot[0].total
            }else{
                dashbordObject.totalRevenue=0
            }
            
         let deemo=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {$group:{
                    _id:"$status",
                    total:{$sum:1}

                }}
            ]).toArray()
        //    console.log("\nDeemo : "+JSON.stringify(deemo));
           for(i=0;i<deemo.length;i++){
               
            if(deemo[i]._id==='placed'){
                dashbordObject.placedOrder=deemo[i].total
                console.log("*******");
            }
            if(deemo[i]._id==='pending'){
                dashbordObject.pendingOrder=deemo[i].total
                console.log("&&&&&&");
            }
        }
            
            

            let ordSts=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {$group:{
                    _id:"$dispatched",
                    total:{$sum:1}

                }}
            ]).toArray()
            //console.log("\nOrder : "+JSON.stringify(ordSts));

            for(i=0;i<ordSts.length;i++){
                if(ordSts[i]._id===false){
                    dashbordObject.orderUnderProcessing=ordSts[i].total
                }
                if(ordSts[i]._id===true){
                    dashbordObject.oderOutDelivery=ordSts[i].total
                }
            }
            
            
            dashbordObject.deletedOrder=await db.get().collection(collection.ORDER_COLLECTION).find({deleted:true}).count()
            dashbordObject.orderUnderProcessing=dashbordObject.orderUnderProcessing-dashbordObject.deletedOrder
            let paymethod=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {$group:{
                    _id:"$payment_option",
                    total:{$sum:1}

                }}
            ]).toArray()
            // console.log('payment method : '+JSON.stringify(paymethod));
            for(i=0;i<paymethod.length;i++){
                if(paymethod[i]._id==='paypal'){
                    dashbordObject.paypal=paymethod[i].total
                }
                if(paymethod[i]._id==='cod'){
                    dashbordObject.cod=paymethod[i].total
                }
                if(paymethod[i]._id==='razor'){
                    dashbordObject.razor=paymethod[i].total
                }
            }
            
            
            
            //console.log("\n\ndashbord data : "+JSON.stringify(dashbordObject));
            resolve(dashbordObject)
        })
    },

    getYearSales:()=>{
        return new Promise(async(resolve,reject)=>{
            let month=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{status:"placed"}
                },
                {
                   
                        $group : {
                           _id : { $dateToString: { format: "%Y-%m-%d", date: "$date" }  } ,
                           totalAmount:{$sum:'$total_amount'},
                           
                        }
                     
                }
            ]).toArray()
            console.log("The Sales Report : "+JSON.stringify(month));
            resolve()
        })
    } ,

    getMonthSales:()=>{
        return new Promise(async(resolve,reject)=>{
            let month=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{status:"placed"}
                },
                {
                   
                        $group : {
                           _id : { $dateToString: { format: "%m", date: "$date" }  } ,
                           totalAmount:{$sum:'$total_amount'},
                           
                        }
                     
                }
            ]).toArray()
            console.log("The Sales Report : "+JSON.stringify(month));
            resolve(month)
        })
    } ,

    getDaySales:()=>{
        return new Promise(async(resolve,reject)=>{
            let month=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{status:"placed"}
                },
                {
                   
                        $group : {
                           _id : { $dateToString: { format: "%Y-%m-%d", date: "$date" }  } ,
                           totalAmount:{$sum:'$total_amount'},
                           
                        }
                     
                }
            ]).toArray()
            console.log("The Sales Report : "+JSON.stringify(month));
            resolve(month)
        })
    },
    addBanner:(img)=>{
        return new Promise(async (resolve,reject)=>{
            await db.get().collection(collection.BANNER_COLLECTION).insertOne({img_path:img}).then((data)=>{
                resolve()
            }).catch((err)=>{
                reject()
            })
        })
    },
    getBanner:()=>{
        return new Promise(async (resolve,reject)=>{
            let banner=await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            if(banner){
                resolve(banner)
            }else{
                reject()
            }
        })
    },
    deleteBanner:(bannerId)=>{
        return new Promise(async (resolve,reject)=>{
            await db.get().collection(collection.BANNER_COLLECTION).remove({_id:objectId(bannerId)}).then(()=>{
                resolve()
            }).catch(()=>{
                reject()
            })
        })
    }
}


