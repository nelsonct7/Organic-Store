const express = require('express');
const prhelper=require('../helper/product-helper')
const usrhelper=require('../helper/user-helpers')
const router = express.Router();
const path=require('path')

const XLSX=require("xlsx")
const pdf = require("pdf-creator-node");
const fs = require("fs");
const async = require('hbs/lib/async');
const { json } = require('body-parser');

const verifyAdmin=(req,res,next)=>{
    if(req.session.adminLoged){
      next()
    }
    else{
      res.redirect('/admin')
    }
  }

router.get('/',verifyAdmin,async (req,res)=>{
console.log('ghhghghghhghgghghhgh');
var html = fs.readFileSync("./views/admin/template.html", "utf8");
    var options = {
        format: "A3",
        orientation: "portrait",
        border: "10mm",
        header: {
            height: "45mm",
            contents: '<div style="text-align: center;">Author: Organic Store</div>'
        },
        footer: {
            height: "28mm",
            contents: {
                first: 'Cover page',
                2: 'Second page', // Any page number is working. 1-based index
                default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
                last: 'Last Page'
            }
        }
    };
    var filename1=Math.random()+'doc'+'.pdf'
    var filepath='./public/documents/'+filename1
    var orders = await prhelper.getAllOrders()
    // console.log(users);
    var document = {
        html: html,
        data: {
          orders: orders,
        },
        path: filepath,
        type: "",
      };
    
pdf.create(document, options)
  .then((res) => {
   // console.log("123123123123123"+JSON.stringify(res));
    
  })
  .catch((error) => {
    console.error(error);
    res.render('errors/error404',{title:'Error',admin:req.session.admin})
  });
let order1=await prhelper.getAllOrdersJson()

// const newObject = order1.reduce(function(result, item, index) {
//   result[index] = item
//   return result
// }, {})

console.log("\nExcel Data "+JSON.stringify(order1[0]));
let students=[
  {name:'vxvcc',age:45,email:'fdffdg'},
  {name:'vxvccfgdg',age:445,email:'fdffgfgfdg'}
]
const workSheet=XLSX.utils.json_to_sheet(students);
const workBook=XLSX.utils.book_new();
let xlName=Date.now()
XLSX.utils.book_append_sheet(workBook,workSheet,xlName)
XLSX.write(workBook,{bookType:'xlsx',type:'buffer'})
XLSX.write(workBook,{bookType:'xlsx',type:'binary'})
xlName=xlName+'.xlsx'
XLSX.writeFile(workBook,'/documents/'+xlName)





  res.render('admin/reports',{path:filename1,admin:req.session.admin,xlpath:xlName})
})



module.exports = router;