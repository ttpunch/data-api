var express = require("express");
const machine = require("../models/machine.js");
var router = express.Router();


const searhDataController=require('../controllers/searchController.js')

router.get("/search",searhDataController)
    
module.exports = router;
