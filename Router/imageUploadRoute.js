var express = require("express");
var router = express.Router();
const cloudinaryController = require("../controllers/cloudinaryController.js");
const {upload}=require('../utils/cloudinary.js')

router.post('/',upload.fields([
    { name: 'image', maxCount: 1 },
    ]), cloudinaryController)

    
module.exports = router;
