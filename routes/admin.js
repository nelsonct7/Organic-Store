const express = require('express');
const async = require('hbs/lib/async');
const { Db } = require('mongodb');
const prhelper=require('../helper/product-helper')
const usrhelper=require('../helper/user-helpers')
//var store=require('../config/multer_loader')
const router = express.Router();
const path=require('path')
const multer=require('multer')


const categoryStorage=multer.diskStorage({
  
  destination: function (req, file, cb) {
    cb(null, './public/category-images')},
  filename:function(req,file,callback){
    callback(null,'category_image-'+Date.now()+'.jpeg')
  }
})
const categoryImgStore=multer({storage:categoryStorage})

const productStorage=multer.diskStorage({
  
  destination: function (req, file, cb) {
    cb(null, './public/product-images')},
  filename:function(req,file,callback){
    callback(null,'product_image-'+Date.now()+'.jpeg')
  }
})
const productImgStore=multer({storage:productStorage})


const bannerStorage=multer.diskStorage({
  
  destination: function (req, file, cb) {
    cb(null, './public/banner-images')},
  filename:function(req,file,callback){
    callback(null,'banner_image-'+Date.now()+'.webp')
  }
})
const bannerImgStore=multer({storage:bannerStorage})
// const upload=multer({
  
//   dest:'./public/category_images'
// })
// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "./public/kill/");
//   },
//   filename: (req, file, cb) => {
//     cb(
//       null,
//       file.fieldname+"-"+Date.now()+".jpg"
//     );
//   },
// });

// const upload = multer({
//   storage:fileStorage
// })
// SET STORAGE
// var storage = multer.diskStorage({
//     destination:  (req, file, cb) => {
//       cb(null, "./public/ifg")
//     },
//     filename:  (req, file, cb) => {
//       cb(null, file.originalname.toLowerCase())
//     }
//   })


//Admin verify middle ware
const verifyAdmin=(req,res,next)=>{
  if(req.session.adminLoged){
    next()
  }
  else{
    res.redirect('/admin')
  }
}


/* GET landning router */
router.get('/',(req,res)=>{
  if(req.session.adminLoged){
    res.redirect('/admin/adminhome')
  }
  else{
    if(req.session.err){
      res.render('admin/admin-login',{ title: 'Organic Store',logerr:req.session.err})  
      req.session.err=false
    }
    else{
      res.render('admin/admin-login',{ title: 'Organic Store'})
    }
  
  }
})

// Admin Login Router
router.post('/login',(req,res)=>{

  if(req.session.adminLoged){
    res.redirect('/')
  }
  else{
    //console.log("Admin req body : "+req.body);
    usrhelper.doAdminLogin(req.body).then((response)=>{
      //console.log("@@@@@@@admin : "+response.status);
      if(response.status){
        req.session.admin=req.body.admin_field
        req.session.adminLoged=true

        res.redirect('/admin/adminhome')
      }else{
        req.session.err=true
        res.redirect('/admin')
        // console.log("$$$$$$$"+req.session.error);
      }
    })
}})

//Admin Logout router
router.get('/logout',(req,res)=>{
  req.session.adminLoged=false
  res.redirect('/admin')
})

// Admin home page router
router.get('/adminhome',async function(req, res, next) {

  if(req.session.adminLoged){
    let dashData=await prhelper.getTotalDashbord()
    let mostSelling=await prhelper.getMostSellin()
    //console.log("\norder view at admin side : "+JSON.stringify(totalOrder));

    res.render('admin/index', { title: 'Admin',admin:req.session.admin,dashData,mostSelling});
  }
  else{
    res.redirect('/admin')
  }

  
});


//Admin Product management routers
router.get('/view-products',function(req,res,next){
  if(req.session.adminLoged){
    prhelper.getAllProductsAdmin().then((products)=>{
        res.render('admin/view-products',{ title: 'Admin',admin:req.session.admin,products})
    })
  }
  else{
    res.redirect('/admin')
  }
});


router.get('/add-products',verifyAdmin,function(req,res,next){
  if(req.session.adminLoged){
    prhelper.getAllCategory().then((category)=>{
      res.render('admin/add-products',{ title: 'Admin',admin:req.session.admin,category})
    })
  }
  else{
    res.redirect('/admin')
  }
  
});


router.post('/add-products',productImgStore.array('image'),verifyAdmin,function(req,res){
  let addError=false
  let addSucces=false
  //console.log("%%%%%%%"+req.body_id);
  console.log(req.body)
  if(req.files){
    let img=req.files
    if(img.length>=2){
      prhelper.addProduct(req.body,(result)=>{  
       //////// console.log(img);
        let id=req.body._id
        //console.log("&&&&&&&&"+req.body_id);
        for (let index = 0; index < img.length; index++) {
          //console.log(img[index]);
          let img_path=img[index].filename
         prhelper.addProductImage(id,img_path)
        }
        addSucces=true
        prhelper.getAllCategory().then((category)=>{
          res.render('admin/add-products',{ title: 'Admin',admin:req.session.admin,category,addSucces})
        })
        
      }
      )
    }else{
      let add2Error=true
      prhelper.getCategory().then((category)=>{
        res.render('admin/add-products',{ title: 'Admin',admin:req.session.admin,category,add2Error})
      })
    }
  }else{
    addError=true
    prhelper.getCategory().then((category)=>{
      res.render('admin/add-products',{ title: 'Admin',admin:req.session.admin,category,addError})
    })
  }
});

router.get('/delete-product/:id',verifyAdmin,(req,res)=>{
  let proId=req.params.id
  prhelper.deleteProduct(proId).then((response)=>{
    //res.redirect('/admin/view-products')
    res.json({success:true})
  })
  //console.log("\nparams ID "+proId);
  
});
 
router.get('/edit-product/:id',verifyAdmin,async (req,res)=>{
  let product=await prhelper.getProductDetails(req.params.id)
  prhelper.getAllCategory().then((category)=>{
    ///console.log("category details : "+category);
  res.render('admin/edit-product',{product,title: 'Admin',admin:true,category})

  })
  
});


router.post('/edit-products/:id',verifyAdmin,productImgStore.array('image'),async (req,res)=>{
  let prId=  req.params.id
  console.log(req.body);
  console.log(req.files);
  await prhelper.updateProduct(prId,req.body).then(()=>{
    
    if(req.files){
      let img=req.files
      
         
          for (let index = 0; index < img.length; index++) { 
           prhelper.addProductImage(prId,img[index].filename)
          }
          res.redirect('/admin/view-products')
    }else{
      res.redirect('/admin/view-products')
    }
  
  })  
});



//Admin User Management routers
router.get('/view-users',verifyAdmin,(req,res)=>{
usrhelper.getAllUser().then((users)=>{
  console.log("$$$$$$"+users);
  res.render('admin/view-users',{title:'Admin',admin:req.session.admin,users})
})
})

router.get('/edit-user/:id',verifyAdmin,async (req,res)=>{
  let usrId=req.params.id
  let userData=await usrhelper.getUserDetails(usrId)
  res.render('admin/edit-user',{title:'Admin',admin:true,userData})
})

router.post('/edit-users/:id',verifyAdmin,async (req,res)=>{
  let usrId=req.params.id
  console.log("User Data "+JSON.stringify(req.body));
  await usrhelper.updateUser(usrId,req.body).then(()=>{
    res.redirect('/admin/view-users')
  })
})

router.get('/delete-user/:id',verifyAdmin,(req,res)=>{
  usrhelper.deleteUser(req.params.id).then((response)=>{
    res.redirect('/admin/view-users')
  })

})

router.get('/add-users',verifyAdmin,(req,res)=>{
  res.render('admin/add-users',{ title: 'Admin',admin:req.session.admin })

})

router.post('/add-users',verifyAdmin,(req,res)=>{
  usrhelper.doSignup(req.body).then((response)=>{
    console.log("%$%%$%$%"+response);
    res.redirect('/admin/view-users')
  })
})




// Admin Category Management routers
router.get('/view-category',verifyAdmin,(req,res)=>{
  prhelper.getAllCategory().then((categories)=>{  
    res.render('admin/view-category',{title:'Admin',admin:req.session.admin,categories})
 })
  })

  router.get('/add-category',verifyAdmin,function(req,res,next){
    if(req.session.adminLoged){
      
        res.render('admin/add-category',{ title: 'Admin',admin:req.session.admin})
      
    }
    else{
      res.redirect('/admin')
    }
    
  });

  router.post('/add-category',categoryImgStore.single('category_image'),function(req,res){
    addCategoryError=false
    addCategorySucces=false
    //console.log("FFFF"+req.body);
    //console.log("File : "+JSON.stringify(req.file));
    if(req.file){
      //let img=req.files.category_image
        prhelper.addCategory(req.body,(result)=>{ 
          let id=req.body._id
          console.log("&&&&&&&&"+JSON.stringify(req.body._id));
          let img_path=req.file.filename
          
          prhelper.updateCategoryImage(id,img_path)
          addCategorySucces=true
           res.render('admin/add-category',{ title: 'Admin',admin:req.session.admin,addCategorySucces}) 
        }
        )
    }else{
      addCategoryError=true
        res.render('admin/add-category',{ title: 'Admin',admin:req.session.admin,addCategoryError})
    } 
  });

  router.get('/delete-category/',(req,res)=>{
    let caegoryId=req.query.id
    //console.log("$$$$$$$&&&&&&******* : "+caegoryId);
    prhelper.deleteCategory(caegoryId).then((response)=>{
      //res.redirect('/admin/view-category')
      res.json({success:true})
    })
    
  
  })


  router.get('/edit-category/:id',verifyAdmin,async (req,res)=>{
    let categoryId=req.params.id
    let categoryData=await prhelper.getCategoryDetails(categoryId)
    res.render('admin/edit-category',{title:'Admin',admin:true,categoryData})
  
  })

  router.post('/edit-category/:id',categoryImgStore.single('category_image'),verifyAdmin,async (req,res)=>{
    let categoryId=req.params.id
    //let filenm=store.single('category_image')
    //console.log("image update : "+req.file.filename);
    await prhelper.updateCategory(categoryId,req.body).then(()=>{
      if(req.file){ 
            let img_path=req.file.filename
            prhelper.updateCategoryImage(categoryId,img_path)
            addCategorySucces=true
            prhelper.getAllCategory().then((categories)=>{  
              res.render('admin/view-category',{title:'Admin',admin:req.session.admin,categories,addCategorySucces})
           })
      }else{
        prhelper.getAllCategory().then((categories)=>{  
          res.render('admin/view-category',{title:'Admin',admin:req.session.admin,categories})
       })
      }
      //res.redirect('/admin/view-category')
    })
  })

  router.get('/view-category-offer',verifyAdmin,async (req,res)=>{
    let category= await prhelper.getAllCategory()
    res.render('admin/view-category-offer',{title:'Admin',admin:req.session.admin,category})
  })

  router.get('/add-cat-offer/:id',verifyAdmin,async (req,res)=>{
    await prhelper.getCategoryByID(req.params.id).then((categ)=>{
      res.render('admin/add-cat-offer',{title:'Admin',admin:req.session.admin,categ})
    })
  })

  router.post('/add-cat-offer',verifyAdmin,async (req,res)=>{

    await prhelper.addCatOffer(req.body).then(()=>{
      res.redirect('/admin/view-category-offer')
    })
  })


  router.post('/remove-cat-offer/:id',verifyAdmin,async (req,res)=>{
    prhelper.removeCatOffer(req.params.id).then(()=>{
      res.json({status:true})
    }).catch(()=>{
      res.json({status:false})
    })
  })


router.get('/coupons',verifyAdmin,async (req,res)=>{
  let coup=await prhelper.getCoupons()
  console.log("Coupon Data : "+JSON.stringify(coup));
    if(coup){
      res.render('admin/view-coupon',{title:'Admin',admin:req.session.admin,coup})
    }else{
      res.render('admin/view-coupon',{title:'Admin',admin:req.session.admin})
    }
})

router.get('/add-coupons',verifyAdmin,(req,res)=>{
 
  res.render('admin/add-coupons',{title:"Admin",admin:req.session.admin})
})

router.post('/add-coupons',verifyAdmin,(req,res)=>{
 
  console.log('Coupon Data : '+JSON.stringify(req.body));
  prhelper.addCoupon(req.body)
  res.redirect('/admin/coupons')
})

router.post('/remove-coupons/:id',verifyAdmin,(req,res)=>{
  console.log("DDFDFDFSDSFDFsd");
  prhelper.removeCoupon(req.params.id).then(()=>{
    res.json({status:true})
  })
  
})



  router.get('/view-orders',verifyAdmin,async (req,res)=>{
    let orders=await prhelper.getAllOrders()
    console.log("\ndata : "+JSON.stringify(orders[0]));

    res.render('admin/view-orders',{title:'Admin',admin:req.session.admin,orders})
  
  })

  router.get('/edit-order/:id',verifyAdmin,async (req,res)=>{
    let orderId=req.params.id
    let orderDetail=await prhelper.getOrderDetails(orderId)
    console.log("\nOrder details in helper : "+orderDetail);
    res.render('admin/edit-order',{title:'Admin',admin:req.session.admin,orderDetail})

  }) 

  router.post('/update-order',verifyAdmin,async (req,res)=>{
    console.log("request : "+JSON.stringify(req.body));
    if(req.body.dispatched){
      await prhelper.productDispatch(req.body.orderId)
    }
    res.redirect('/admin/view-orders')
  })

  router.get('/delete-order/:id',verifyAdmin,async(req,res)=>{
    let orderId=req.params.id
    // console.log('Data : '+orderId);
    await usrhelper.removeOrder(orderId)
    res.json({success:true})
  })
  router.get('/reports',verifyAdmin,(req,res)=>{
    res.render('admin/reports',{title:'Admin',admin:req.session.admin})
  })

  router.post('/get-line-data',verifyAdmin,async (req,res)=>{
    await prhelper.getMonthSales().then((data)=>{
      console.log("Month data : "+JSON.stringify(data));
      res.json({data})
    }) 
  })

  router.get('/banner',verifyAdmin,async (req,res)=>{
    await prhelper.getBanner().then((banners)=>{console.log("Banners : "+JSON.stringify(banners));
    res.render('admin/view-banner',{title:'Admin',admin:req.session.admin,banners})
  }).catch((err)=>{
      res.render('errors/error404',{title:'Admin',admin:req.session.admin})
    })
    

    
  })

  router.get('/add-banner',verifyAdmin,(req,res)=>{
    res.render('admin/add-banner',{title:'Admin',admin:req.session.admin})

  })

  router.post('/add-banner',verifyAdmin,bannerImgStore.single('banner_image'),verifyAdmin,async(req,res)=>{
      // await prhelper.addBanner(re)
      console.log('Admin side banner : '+JSON.stringify(req.file));
      await prhelper.addBanner(req.file.filename).then((data)=>{
        res.redirect('/admin/banner')
      }).catch((err)=>{
        res.send(
          Swal.fire({
            title: 'Failed',
            text: "Image Error",
            icon: 'alert',
            showCancelButton: false,
            confirmButtonColor: '#11B619',
            cancelButtonColor: '#A19391',
            confirmButtonText: 'Ok'
            }).then((result) => {
                 if (result.isConfirmed) {
                                        window.location.href='/admin/banner';
                                        }
            })
        )
      })

  })

  router.get('/delete-banner/:id',verifyAdmin,async (req,res)=>{
    
    let bannerId=req.params.id
    console.log("hjhjhjhjhjh : "+bannerId);
    await prhelper.deleteBanner(bannerId).then((reso)=>{
        res.send({status:true})
    }).catch(()=>{
      res.render('errors/error404')
    })
  })

  router.get('/view-offers',verifyAdmin,(req,res)=>{
    res.render('admin/offer-control',{title:'Admin',admin:req.session.admin})
  })

  router.get('/product-offers',verifyAdmin,async(req,res)=>{
    await prhelper.getProductInfoOffer().then((products)=>{
       console.log(products);
      res.render('admin/view-product-offers',{title:'Admin',admin:req.session.admin,products})
    }).catch((err)=>{
      res.render('errors/error404',{title:'Data Error',admin:req.session.admin})
    })
  })

  router.get('/add-offer/:id',verifyAdmin,async (req,res)=>{
    let pr_id=req.params.id
    let product=await prhelper.getProductDetails(pr_id)
    res.render('admin/add-offer',{title:"Admin",admin:req.session.admin,product})
  })

  router.post('/add-offer',verifyAdmin,async (req,res)=>{
    console.log("Offer data at form "+JSON.stringify(req.body)); 
    await prhelper.addoffer(req.body).then((data)=>{
      res.redirect('/admin/product-offers')
    })
  })

  router.get('/remove-offer/:id',verifyAdmin,async(req,res)=>{
    await prhelper.removeOffer(req.params.id).then(()=>{
      res.redirect('/admin/product-offers')
    })
  })

  router.get('/admin-feedback',verifyAdmin,async (req,res)=>{
    //console.log('kjkjkjkjkjkjkj');
    await prhelper.getFeedback().then((data)=>{

      res.render('admin/view-feedback',{data,admin:req.session.admin})
    })
  })

router.get('/view-message',verifyAdmin,async (req,res)=>{
  await prhelper.getMessage().then((data)=>{
    console.log('\n Feed back data ');
    console.log(data);
    res.render('admin/view-message',{title:'Admin',admin:req.session.admin,data})
  })
})

module.exports = router;
