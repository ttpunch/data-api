const machine = require("../models/machine.js");


const GetController= async (req, res) => {
       
    const {id}=req.params
    console.log(id)
    
     const machinedata = await machine.find({ machine_no:id});
    
    res.json(machinedata);
}

module.exports = GetController;