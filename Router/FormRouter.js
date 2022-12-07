var express = require("express");
var router = express.Router();
const machine = require("../models/machine.js");

router.post("/", async (req, res) => {
  //  // Data entry
  await machine.create({
    machine_no: req.body.mcdata,
    breakdown: req.body.bgdetail,
    bgdate: req.body.bgdate,
  })
  res.redirect('./recorddata')

});

module.exports = router;
