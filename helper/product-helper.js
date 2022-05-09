
const { reject } = require('bcrypt/promises');
const { response } = require('express');
var db=require('../config/connection');
var collection=require('../config/collections')
var objectId=require('mongodb').ObjectId
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })


module.exports={
    addProduct:(product,callback)=>{
       product.date=Date.now()
       product.deleted=false
       db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            callback(data)
        })

    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({deleted:false,status:'Available'}).toArray()
            resolve(products)
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
                    date:Date.now(),
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
    }
}


