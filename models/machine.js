const mongoose = require("mongoose");

// Define a schema
const Schema = mongoose.Schema;

const machineSchema = new Schema({
  machine_no: {type:String,require:true},
  breakdown: {type:String,require:true},
  bgdate:{type:Date,require:true},
  },
)

const machine=mongoose.model("bgdata",machineSchema)
module.exports=machine;