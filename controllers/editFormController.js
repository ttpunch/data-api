const machine = require("../models/machine.js");

const EditformController = async (req, res) => {
  const { id } = req.params;
  console.log("id :",id)

  try {
   const data= await machine.findByIdAndUpdate(id, {
      breakdown: req.body.breakdown,
    },
    {
      new: true
    });
    res.status(201).json(data)
  } catch (e) {
    res.status(400).send(e.message)
  }
};

module.exports = EditformController;
