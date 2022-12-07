const machine = require("../models/machine.js");


const PostController= async (req, res) => {
       
    const mcno=req.params
    
    // const machinedata = await machine.find({ machine_no:mcno});
    
   console.log(`"get mc no :" ${mcno}`)
//    res.send(machinedata);
}

module.exports = PostController;