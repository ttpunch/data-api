const machine = require("../models/machine.js");

const EditformController = async (req, res) => {
  const { id } = req.params;

  await machine.findByIdAndUpdate(id, {
    breakdown: req.body.breakdown,
  });

 res.status(201)
 
};

module.exports = EditformController;
