const machine = require("../models/machine.js");

const EditformController = async (req, res) => {
  const { id } = req.params;

  await machine.findByIdAndUpdate(id, {
    breakdown: req.body.breakdown,
  });

 res.send("Data Entered")
};

module.exports = EditformController;
