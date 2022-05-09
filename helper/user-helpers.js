var db=require('../config/connection');
const bcrypt=require('bcrypt');
const { promise, reject } = require('bcrypt/promises');
const async = require('hbs/lib/async');
const { response } = require('../app');
var objectId=require('mongodb').ObjectId
var collection=require('../config/collections')

module.exports={
    doSignup:(userData)=>{

        return new Promise(async(resolve,reject)=>{
            userData.user_password=await bcrypt.hash(userData.user_password,10)
            userData.status=true
            userData.deleted=false
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data)
            })
            
        })
        

    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({user_email:userData.user_email})
            let loginStatus=false;
            let response={}
            response.user_mobile=user.user_mobile
            response.user_name=user.user_name
            if(user && user.status==true && user.deleted==false){
                bcrypt.compare(userData.user_password,user.user_password).then((stat)=>{
                    if(stat){
                        console.log("Login Success...");
                        response.status=true
                        resolve(response)
                    }else{
                        console.log("Login Failed...");
                        resolve({status:false})
                    }
                })

            }else{
                console.log("Login Failed...");
                resolve({status:false})
            }
        })
    },
    addToCart:(proId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection('cart').findOne({user:objectId(userId)})
            if(userCart){
                db.get().collection('cart').updateOne({user:objectId(userId)},{
                    $push:{products:objectId(proId)}
                }).then((response)=>{
                    resolve()
                })
            }else{
                let cartObj={
                    user:objectId(userId),
                    products:[objectId(proId)]
                }
                db.get().collection('cart').insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })

    },

    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection('cart').aggregate([
                {
                    $match:{user:objectId(userId)}

                },
                {
                    $lookup:{
                        from:'product',
                        let:{proList:'$products'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:['$_id',"$$proList"]
                                    }
                                }
                            }

                        ],
                        as:'cartItems'
                    }
                }

            ]).toArray()
            resolve(cartItems[0].cartItems)
        })
    },
    getAllUser:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
            
        })

    },
    getUserDetails:(usrId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(usrId)}).then((response)=>{
                resolve(response)
            })
        })

    },
    updateUser:(usrId,user)=>{
        console.log("Control reached.... "+user.status);
        if(user.status=='false'){
            console.log("Control reached....");
            user.status=false
        }else{
            user.status=true
        }
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(usrId)},
            {
            $set:{
                status:user.status
            }
            }).then((response)=>{
                resolve()
            })
        })
    },
    deleteUser:(usrId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(usrId)},
            {
            $set:{
                
                deleted:true,
                status:false
            }
            }).then((response)=>{
                resolve()
            })
        })
    },
    doAdminLogin:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({og_admin:adminData.admin_field})
            
            let loginStatus=false;
            let response={}
            if(admin){
                //console.log("$$$$$$$$$$$$"+adminData.psd);
                    if(adminData.admin_password==admin.admin_password){
                       // console.log("Login Success...");
                        response.status=true
                        response.admin=admin
                        resolve(response)
                    }else{
                        console.log("Login Failed...");
                        resolve({status:false})
                    }
                

            }else{
                console.log("Login Failed...");
                resolve({status:false})
            }
        })
    },
    userPresent:(usermail)=>{
        return new Promise(async(resolve,reject)=>{
            let admin=await db.get().collection('user').findOne({uemail:usermail})
            let response={}
            if(admin){
                console.log("sign up false...");
                response.status=true
                resolve(response)
            }else{
                console.log("sign up true...");
                resolve({status:false})
            }
        })
        
        
    }



}