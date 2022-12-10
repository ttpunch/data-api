var express = require("express");
var router = express.Router();
const machine = require("../models/machine.js");

router.post("/",  (req, res) => {
  //  // Data entry

  const data=new machine({
    machine_no: req.body.mcdata,
    breakdown: req.body.bgdetail,
    bgdate: req.body.bgdate,
  })

  console.log(req.body)
  
   data.save(function(err, doc) {
    if (err) return console.error(err);
    console.log("Document inserted succussfully!");
  });

});

module.exports = router;
