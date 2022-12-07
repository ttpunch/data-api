var express = require("express");
var router = express.Router();
const machine = require("../models/machine.js");
const PostController = require("../controllers/PostController.js");
const GetController = require("../controllers/GetController.js");

router.post("/", PostController)
router.get("/:id", GetController)
    
module.exports = router;
