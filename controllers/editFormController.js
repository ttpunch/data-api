const machine = require("../models/machine.js");
const { buildUpdate } = require("./editHelpers.js");

const EditformController = async (req, res) => {
  const { id } = req.params;
  const update = buildUpdate(req.body);

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: "No valid fields to update" });
  }

  try {
    const data = await machine.findByIdAndUpdate(id, update, { new: true });
    if (!data) return res.status(404).json({ message: "Record not found" });
    return res.status(201).json(data);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

module.exports = EditformController;
