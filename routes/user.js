const {response} = require('express');
var express = require('express');
const {redirect} = require('express/lib/response');
var router = express.Router();
var prhelper = require('../helper/product-helper')
var usrhelper = require('../helper/user-helpers')
// var messagebird=require('messagebird')('rCPRMKLZeOYZrU17uDIucBatJ')
var config = require('../config/otpAuth');
const {reject} = require('bcrypt/promises');
const async = require('hbs/lib/async');
const userHelpers = require('../helper/user-helpers');
const {ObjectId} = require('mongodb');
const session = require('express-session');
var client = require('twilio')(config.accountSID, config.authToken)

// midleware
function validTotp(req, res, dbResponse) {
    var number = `+91${
        dbResponse.user_mobile
    }`;
    client.verify.services(config.serviceSID).verifications.create({to: number, channel: 'sms'}).then((data) => {
        res.render('user/otpVerify', {number, dbResponse})
    })
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
        next()
    } else {
        res.redirect('/login')
    }
}

/* GET home page. */
router.get('/', async function (req, res, next) {

    if (! req.session.loggedIn) {
        prhelper.getAllProducts().then((products) => {
            prhelper.getBanner().then((banner)=>{
                res.render('user/index', {
                    title: 'Organic Store',
                    products,
                    banner
                })
            }).catch((err)=>{
            res.render('errors/error404')
            })

        })
        .catch((err)=>{
            res.render('errors/error404')
        })
    } else {
        let cartCount = 0
        let user = req.session.user
        if (req.session.loggedIn) {
            cartCount = await userHelpers.getCartCount(req.session.user._id)

        }
        // console.log("\nUser Id : "+req.session.user._id);
        // console.log("\nlogin time user : "+user._id);
        prhelper.getAllProducts().then((products) => {
            prhelper.getBanner().then((banner)=>{
                res.render('user/index', {
                    title: 'Home',
                    user,
                    products,
                    cartCount,
                    banner
                })
            }).catch(()=>{
                res.render('errors/error404')
            })

        })
        .catch((err)=>{
            res.render('errors/error404')
        })
    }


});

router.get('/login', function (req, res) {
    if (req.session.loggedIn) {
        res.redirect('/')
    } else {

        res.render('user/userlogin', {logerr: req.session.userError})
        req.session.userError = false
    }

});

router.post('/login', function (req, res, next) {

    if (req.session.loggedIn) {
        res.redirect('/')
    } else {

        usrhelper.doLogin(req.body).then((response) => {
            if (response.status) {
                console.log("Db Number : " + response.user_name);
                // validTotp(req,res,response)
                req.session.user = response
                req.session.loggedIn = true
                res.redirect('/')


            } else {
                req.session.userError = true
                res.redirect('/login')
                // console.log("$$$$$$$"+req.session.error);
            }
        })
        .catch((err)=>{
            res.render('errors/error404')
        })
    }


});

router.get('/signup', function (req, res, next) {

    if (req.session.loggedIn) {
        res.redirect('/')
    } else {
        prerr = req.session.prerror
        res.render('user/usersignup', {
            title: "Signup",
            prerr
        })
        req.session.prerror = false
    }


});

router.post('/signup', function (req, res, next) {


    usrhelper.userPresent(req.body.user_email).then((response) => {
        if (response.status) {

            req.session.prerror = true
            res.redirect('/signup')
        } else {
            usrhelper.doSignup(req.body).then((response) => {
                req.session.loggedIn = true
                req.session.user = req.body.user_name
                res.redirect('/')
            })
            .catch((err)=>{
                res.render('errors/error404')
            })
        }
    })
    .catch((err)=>{
        res.render('errors/error404')
    })

});

router.post('/delete-profile',verifyLogin,async(req,res)=>{
    try{
        let userId=req.session.user._id
        await usrhelper.deleteProfile(userId).then(()=>{
            req.session.user=null
            req.session.loggedIn=false
            res.json({profileDeleted:true})
        })
    }catch(err){

    }
})

router.post('/otpauth/:number', (req, res) => {

    let userName = req.body.user
    let number = req.params.number
    // console.log("This is otp : "+req.body.otp1);
    console.log("This is username : " + userName);
    client.verify.services(config.serviceSID).verificationChecks.create({to: number, code: req.body.otp1}).then((resp) => {
        if (resp.valid) {
            req.session.user = userName
            console.log("session user : " + req.session.user);
            req.session.loggedIn = true
            res.redirect('/')
        } else {
            res.render('user/userlogin', {otpError: true})
        }

    }).catch((reject) => {
        console.log("Invalid OTP");
    })

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
})

router.get('/logout', (req, res) => {
    req.session.loggedIn = false
    req.session.user = null
    res.redirect('/')
})

router.get('/view-product/:id', (req, res) => {
    prhelper.getProductDetails(req.params.id).then((product) => {
        console.log("\nProduct Details ");
        console.log(product);
        res.render('user/view-products', {
            title: "Product View",
            product
            
        })
    })
    .catch((err)=>{
        res.render('errors/error404')
    })
})


// User Cart routers

router.get('/check-out', verifyLogin, (req, res) => {
    res.render('user/userCheckOut', {title: "CheckOut"})
})
module.exports = router;

 
router.get('/get-cart', verifyLogin, async (req, res) => {
    let count = await usrhelper.getCartCount(req.session.user._id)
    console.log("\ncount : " + count);
    if (count) {
        let products = await usrhelper.getCartProducts(req.session.user._id)
        let total = await usrhelper.findCartTotal(req.session.user._id)

        res.render('user/userCart', {
            title: "Cart",
            user: req.session.user,
            products,
            total
        })
    } else {
        res.render('user/cart-empty', {
            title: "Empty Cart",
            user: req.session.user
        })
    }

})

router.get('/add-to-cart/:id', verifyLogin, (req, res) => { // console.log("\nThe recieved user  id : "+ObjectId(req.session.user._id));
    usrhelper.addToCart(req.params.id, req.session.user._id).then(() => {
        res.json({status: true})
    })
    .catch((err)=>{
        res.render('errors/error404')
    })
})

router.post('/cart-Product-Inc-Dec', verifyLogin, async (req, res) => {
    console.log("request reached " + JSON.stringify(req.body));

    await usrhelper.updateCartQuantity(req.body).then(async (response) => {
        response.total = await usrhelper.findCartTotal(req.body.userId)
        // console.log('\ntotal : '+response.total);
        res.json(response)
    })
    .catch((err)=>{
        res.render('errors/error404')
    })
})

router.get('/remove-item-from-cart/:id', verifyLogin, (req, res) => {
    usrhelper.removeCartItem(req.params.id, req.session.user._id).then((resolve) => {
        res.redirect('/get-cart')
    })
    .catch((err)=>{
        res.render('errors/error404')
    })
})

router.get('/find-total/:id', verifyLogin, async (req, res) => {
    userId = req.params.id
    let total = await usrhelper.findCartTotal(userId)
    let address = await usrhelper.getAllAddressUser(userId)
    // console.log('Address in Find total router...'+JSON.stringify(address));
    if (address) {
        //console.log('\n Address in find total : ' + JSON.stringify(address));
        res.render('user/check-out', {
            title: 'Check Out',
            user: req.session.user,
            total,
            address
        })
    } else {
        res.render('user/add-address', {
            title: 'Check Out',
            user: req.session.user,
            total
        })
    }

})

router.post('/proceed-to-payment', verifyLogin, async (req, res) => {

    let user_id = req.body.userId
    await usrhelper.updateAddress(req.body).then(async (responce) => {
        adr_id=responce.insertedId;
        let details1 = await usrhelper.getUserAddress(adr_id)
        console.log("\nFind user address : "+JSON.stringify(details1));
        let total = await usrhelper.findCartTotal(user_id)
        res.render('user/payment-confirm', {
            title: 'Payment',
            user: req.session.user,
            details: details1,
            total
        })
    })
    .catch((err)=>{
        res.render('errors/error404')
    })
    

})

router.get('/proceed-to-payment', verifyLogin, async (req, res) => {
    let user_id = req.session.user._id
    let total = await usrhelper.findCartTotal(user_id)
    res.render('user/add-address', {
        title: 'Check Out',
        user: req.session.user,
        total
    })

})

router.post('/proceed-to-payment-address', verifyLogin, async (req, res) => {
    let adrId=req.body.arrdessIndex
    let user_id = req.session.user._id
    let details1 = await usrhelper.getUserAddress(adrId)
    let total = await usrhelper.findCartTotal(user_id)
    res.render('user/payment-confirm', {
        title: 'Payment',
        user: req.session.user,
        details: details1,
        total,
    })

})

router.post('/place-order', verifyLogin, async (req, res) => {
    console.log("\nRequest body : " + JSON.stringify(req.body));
    let user_id = req.session.user._id
    let adr_id=req.body.addressId
    let details = await usrhelper.getUserAddress(adr_id)
    let addressId1 = details._id
    let adrIndex = req.body.arrayIndex
    let total = await usrhelper.findCartTotal(user_id)
    let prList = await usrhelper.getCartProductsList(user_id)
    usrhelper.removeCart(user_id)
    let payment_option = req.body.paymentOptions
    req.session.total=total
    req.session.prlist=prList

    usrhelper.addToOrder(user_id, addressId1, total, payment_option, prList).then((response) => {
        // console.log('\n$$$$$$$$$ Inserted daata : '+JSON.stringify(response));
        let orderId=response.insertedId
        req.session.orderId=orderId
        // console.log('\n$$$$$$$$$ Inserted daata : '+JSON.stringify(orderId));
        console.log('/n : order id :'+orderId);
        if(payment_option=='cod'){
            res.json({codSuccess:true})
        }

        if(payment_option=='razor'){
            usrhelper.generateRazor(orderId,total).then((data)=>{
                res.json({razorSuccess:true,order:data,user:req.session.user})
            }).catch((eror)=>{
                console.log("\n////Error : "+JSON.stringify(eror));
                res.json({razor:false})
            }) 
        }
        

        if(payment_option=='paypal'){
            usrhelper.generatePaypal(orderId,total,user=req.session.user).then((data)=>{
                res.json({paypalSuccess:true,data})
            }).catch((err)=>{
                console.log("Error..: ");
            })
            
        }
        
        
        // res.render('user/order-success', {
        //     title: 'Order Success...',
        //     user: req.session.user,
        //     orderId,  
        //     prList,
        //     total
            
        // })
    })
    .catch((err)=>{
        res.render('errors/error404')
    })

})

router.get('/paypallSuccess',(req,res)=>{
    const paypal = require('paypal-rest-sdk');
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": req.session.total
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        // throw error;
        console.log("Error : "+error);
    } else {
        // console.log("Payment details : "+JSON.stringify(payment));
        usrhelper.changeStatus(req.session.orderId).then(()=>{
            
            let total=req.session.total
            let orderId=req.session.orderId
            let prList=req.session.prlist
            res.render('user/order-success',{title:'Order Success',total,orderId,prList})
        })

        
    }
});

    
})

router.post('/verifyPayment',(req,res)=>{
   console.log("Data in router : "+JSON.stringify(req.body));
    let data=req.body
    usrhelper.verifyPayment(data).then(()=>{
        usrhelper.changeStatus(data.order.receipt).then((resp)=>{
            console.log("Updated Success fully");
            res.json(true)
        })
    }).catch(()=>{
        console.log("Failed Transaction");
       
    })
})


router.get('/view-orders', verifyLogin, async (req, res) => {
    userId = req.session.user._id
    let orders = await usrhelper.getOrders(userId)
    console.log('\nOrder details in user router : '+JSON.stringify(orders));

    if (orders.length!=0) {
        res.render('user/view-orders', {
            title: 'Orders',
            user: req.session.user,
            orders
        })
    } else {
        res.render('user/empty-orders', {
            title: 'Orders',
            user: req.session.user
        })
    }
})

router.get('/remove-order/:id', verifyLogin, async (req, res) => {
    let userId = req.session.user._id
    let orderId = req.params.id
    await usrhelper.removeOrder(orderId).then(async (response) => {
        let orders = await usrhelper.getOrders(userId)
        res.render('user/view-orders', {
            title: 'Orders',
            user: req.session.user,
            orders
        })
    })

})

router.get('/view-order-products/:id/:total', verifyLogin, async (req, res) => {
    let orderId = req.params.id
    let total = req.params.total
    let products = await usrhelper.getOrderProducts(orderId)
    res.render('user/view-order-products', {
        title: 'Order Products',
        user: req.session.user,
        products,
        orderId,
        total
    })
})

router.get('/view-order-history', verifyLogin, async (req, res) => {
    let userId = req.session.user._id
    let orders = await usrhelper.getAllOrders(userId)
    console.log('\nOrders : ' + JSON.stringify(orders));
    res.render('user/view-order-history', {
        title: 'History',
        orders
    })
})

router.get('/view-profile',verifyLogin,async (req,res)=>{
    let updateSuccess=false
    if(req.session.prupdate){
        updateSuccess=true
    }
    req.session.prupdate=false
    let userAddress=await usrhelper.getAllAddressUser(req.session.user._id)
    res.render('user/user-profile',{title:"User Profile",user:req.session.user,userAddress,updateSuccess})

})

router.post('/edit-address/:id',verifyLogin,async (req,res)=>{
     
    let adrId=req.params.id
    console.log('\nAddress Id : '+JSON.stringify(adrId));
    let editAddress=await usrhelper.getUserAddress(adrId)
    res.render('user/edit-address',{title:'Address Edit',editAddress})
})

router.post('/update-user-address',verifyLogin,async(req,res)=>{
    console.log("\nUpdate router request body : "+JSON.stringify(req.body));
    await usrhelper.updateUserAddress(req.body).then((response)=>{
        res.redirect('/view-profile')
    })
    .catch((err)=>{
        res.render('errors/error404')
    })
})

router.get('/edit-profile',verifyLogin,(req,res)=>{
    res.render('user/edit-profile',{title:'Profile',user:req.session.user})
})

router.post('/edit-profile',verifyLogin,async (req,res)=>{
    console.log(req.body);
    let usrId=req.session.user._id
    await usrhelper.updateProfile(usrId,req.body).then((data)=>{
        req.session.prupdate=true
        res.redirect('/view-profile')
    })
    .catch((err)=>{
        res.render('errors/error404')
    })
})

router.get('/change-password',verifyLogin,(req,res)=>{
    let chpsd=null
    let notchpsd=null
    if(req.session.psdCh){
        chpsd=true
        req.session.psdCh=null
    }
    if(req.session.notpsdCh){
        notchpsd=true
        req.session.notpsdCh=null
    }
    res.render('user/change-password',{title:'Profile',user:req.session.user,chpsd,notchpsd})
})

router.post('/change-password',verifyLogin,async (req,res)=>{
    console.log("\nForm Data Ajax : "+JSON.stringify(req.body));
    await usrhelper.updatePassword(req.body).then((responce)=>{
        if(responce.status){
            req.session.psdCh=true
            res.redirect('/change-password')
        }
        else{
            req.session.notpsdCh=true
            res.redirect('/change-password')
        }
    })
    .catch((err)=>{
        res.render('errors/error404')
    })

})

router.get('/imgdemo',(req,res)=>{
    res.render('user/imgdemo')
})