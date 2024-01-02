const machine = require("../models/machine.js");

const BgdataController = async (req, res) => {
  try {
    const data = await machine.find({}).sort({bgdate:-1});
    res.json(data);
    } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = BgdataController;
