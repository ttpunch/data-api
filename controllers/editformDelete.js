const machine = require("../models/machine.js");
const { buildDeleteResult } = require("./editHelpers.js");

// The previous version never called res, so the request hung until the client
// timed out while the record was in fact deleted.
const editformDelete = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await machine.deleteOne({ _id: id });
    const { status, body } = buildDeleteResult(result, id);
    return res.status(status).json(body);
  } catch (error) {
    // A malformed ObjectId lands here.
    return res.status(400).json({ message: "Invalid record id" });
  }
};

module.exports = editformDelete;
