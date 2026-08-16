const express = require("express");
const router = express.Router();
const agentActController = require("../controllers/agentActController.js");

router.post("/", agentActController);

module.exports = router;
