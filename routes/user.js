const { response } = require('express');
var express = require('express');
const { redirect } = require('express/lib/response');
var router = express.Router();
var prhelper=require('../helper/product-helper')
var usrhelper=require('../helper/user-helpers')
//var messagebird=require('messagebird')('rCPRMKLZeOYZrU17uDIucBatJ')
var config=require('../config/otpAuth');
const { reject } = require('bcrypt/promises');
var client = require('twilio')(config.accountSID, config.authToken)

//midleware
function validTotp(req,res,dbResponse){
  var number=`+91${dbResponse.user_mobile}`;
  client.verify
  .services(config.serviceSID)
  .verifications
  .create({
    to:number,
    channel:'sms'
  })
  .then((data)=>{
    res.render('user/otpVerify',{number,dbResponse})
  })
}

// function validateOtp(req,res,dbResponse,next){
//   var number=`+91${dbResponse.user_mobile}`;
//   console.log("Mobile number : "+number);
//   messagebird.verify.create(number,
//     {template:"Your verification code is %token"},
//     (err,response)=>{
//       if(err){
//         res.render('user/userlogin',{logerr:req.session.otperr=true})
//       }else{
//         id=response.id
//         res.render('user/otpVerify',{number,id,dbResponse})
//       }
//   })
 
// }
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }
  else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {

    
    let user=req.session.user
    console.log("login time user : "+user);
    prhelper.getAllProducts().then((products)=>{
      res.render('user/index',{ title: 'Home',user,products})
    })
 
  
  
});

router.get('/login', function(req, res) {
   if(req.session.loggedIn)
   {
     res.redirect('/')
   }else{
    
    res.render('user/userlogin',{logerr:req.session.userError})
    req.session.userError=false
  }
  
});

router.get('/signup', function(req, res, next) {
  
  if(req.session.loggedIn)
  {
    res.redirect('/')
  }else{
    prerr=req.session.prerror
    res.render('user/usersignup',{title:"Signup",prerr})
    req.session.prerror=false
 }
  

});

router.post('/signup', function(req, res, next) {


  usrhelper.userPresent(req.body.uemail).then((response)=>{
    if(response.status){
      
      req.session.prerror=true
      res.redirect('/signup')
    }else{
      usrhelper.doSignup(req.body).then((response)=>{
        req.session.loggedIn=true
        req.session.user=req.body.user_name
        res.redirect('/')
      })
    }
  })

});

router.post('/login', function(req, res, next) {
  
  if(req.session.loggedIn){
    res.redirect('/')
  }
  else{
    
    usrhelper.doLogin(req.body).then((response)=>{
      if(response.status){
        console.log("Db Number : "+response.user_name);
        validTotp(req,res,response)
        // if(otpValid){
        //   req.session.user=response.user
        //   req.session.loggedIn=true
        //   res.redirect('/')
        // }else{
        //   req.session.userError=true
        //   res.redirect('/login')
        // }
       
      }else{
        req.session.userError=true
        res.redirect('/login')
        // console.log("$$$$$$$"+req.session.error);
      }
    }) 
  }


});

router.post('/otpauth/:number',(req,res)=>{
  
  let userName=req.body.user
  let number=req.params.number
  //console.log("This is otp : "+req.body.otp1);
  console.log("This is username : "+userName);
  client.verify
  .services(config.serviceSID)
  .verificationChecks.create({
    to:number,
    code:req.body.otp1
  }) 
  .then((resp)=>{
    if(resp.valid){
      req.session.user=userName
    console.log("session user : "+req.session.user);
    req.session.loggedIn=true
    res.redirect('/')
    }else{
      res.render('user/userlogin',{otpError:true})
    }
    
  })
  .catch((reject)=>{
    console.log("Invalid OTP"); 
  })

  // let tocken=req.body.otp1
  // messagebird.verify.verify(id,tocken,(err,response)=>{
  //   if(err){
  //     res.render('user/otpVerify',{id,dbResponse,otpError:true})
  //   }else{
      
  //       req.session.user=dbResponse.user_name
  //       req.session.loggedIn=true
  //       res.redirect('/')
  //   }
  // })
})

router.get('/logout',(req,res)=>{
  req.session.loggedIn=false
  req.session.user=null
  console.log("555555555");
  res.redirect('/')
})

router.get('/cart',verifyLogin,async (req,res)=>{
  let products=await usrhelper.getCartProducts(req.session.user._id)
  console.log(products);
  res.render('user/cart',{title:"Cart",user:req.session.user})
})

router.get('/add-to-cart/:id',verifyLogin ,(req,res)=>{
  usrhelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.redirect('/')
  })
})


router.get('/view-product/:id',(req,res)=>{
  prhelper.getProductDetails(req.params.id).then((product)=>{
    res.render('user/view-products',{title:"Product View",user:req.session.user,product})
  })
})
module.exports = router;
