const mongoose = require("mongoose");

// Define a schema
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {type:String,require:true},
  password: {type:String,require:true},
 },{
  timestamps:true
 }
)

const user=mongoose.model("userdata",userSchema)
module.exports=user;