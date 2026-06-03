const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const roleSchema=new Schema({
    name:{type:String,enum:["user","admin"],default:'user'},
    description:{type:String,default:null},
    permissions:[{type:String,default:['user|profile|read','user|profile|write']}]
})

module.exports = mongoose.model("Roles", roleSchema, "roles");