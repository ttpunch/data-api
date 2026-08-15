var express = require("express");
var router = express.Router();
const agentController = require("../controllers/agentController.js");

router.post("/interpret", agentController);

module.exports = router;
