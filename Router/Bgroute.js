var express = require("express");
const machine = require("../models/machine.js");
var router = express.Router();


const BgdataController=require('../controllers/BgdataController')

router.get("/",BgdataController)
    
module.exports = router;
