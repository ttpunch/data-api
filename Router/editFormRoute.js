var express = require("express");
const EditformController = require("../controllers/editFormController.js");
var router = express.Router();
const machine = require("../models/machine.js");

// router.post("/", EditformController)

router.put("/:id", EditformController)

 
 
 
//   await machine.create({
//     machine_no: req.body.mcdata,
//     breakdown: req.body.bgdetail,
//     bgdate: req.body.bgdate,
//   })
//   res.redirect('./editdata')



module.exports = router;
