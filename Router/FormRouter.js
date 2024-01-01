var express = require("express");
var router = express.Router();
const machine = require("../models/machine.js");

router.post("/", async (req, res) => {
  //  // Data entry

  const data = new machine({
    machine_no: req.body.mcdata,
    breakdown: req.body.bgdetail,
    bgdate: req.body.bgdate,
    image:req.body.image
  });

  try {
    await data.save();
    res.status(201).send(data);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

module.exports = router;
