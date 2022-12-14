const machine = require("../models/machine.js");

const editformDelete=  (req, res) => {
  const { id } = req.params;
  console.log(id);

  machine.deleteOne( {_id:id} )
  .then(response => {
    console.log('Successfully deleted resource!');
  })
  .catch(error => {
    console.log(error);
  });

}
module.exports = editformDelete;
