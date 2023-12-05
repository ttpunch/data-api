const machine = require("../models/machine.js");

const searchController = async (req, res) => {
  const { search } = req.query; // Retrieve the search term from query parameters
  

  let query = {}; // Initialize an empty query object

  if (search) {
    // If a search term is provided, add a search condition to the query for the 'description' field
    query = {
      $or: [
        { breakdown: { $regex: search, $options: "i" } }, // Search in breakdown field
        { machine_no: { $regex: search, $options: "i" } }, // Search in title field (modify field name as needed)
        // Add more fields as needed in the $or array
      ],
    };
  }

  try {
    // Fetch data based on the query
    const data = await machine.find(query);
    res.json(data);
    console.log(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = searchController;
