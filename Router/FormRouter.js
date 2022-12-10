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
  
  data.save(function(err, doc) {
    if (err) return console.error(err);
    res.status(201);
  });

  

  console.log(req.body)
  

});

module.exports = router;
