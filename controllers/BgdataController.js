const machine = require("../models/machine.js");


const BgdataController= async(req, res) => {

  
       
  const datafetch = await machine.find({ }).then((data)=>{

    res.json(data);
    res.header('Access-Control-Allow-Origin', '*');
}
  )
  
}

module.exports = BgdataController;