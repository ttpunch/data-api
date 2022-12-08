const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const machine = require("./models/machine.js");
const express = require("express");
const app = express();
const dotenv=require('dotenv')

const cors=require('cors')

dotenv.config();

const formroute=require('./Router/FormRouter')
const searchroute=require('./Router/SearchRouter')
const bgroute=require('./Router/Bgroute')
const editFormRoute=require('./Router/editFormRoute')


app.use({
  origin:"https://data-api-d6lk.onrender.com/"
})

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

 
//Submit form Data 
app.use('/machinedata',bgroute)
app.use('/submit-form',formroute)
app.use('/machineroute',searchroute)
app.use('/editdata/',editFormRoute)
//________________________________________________________________________________________________________________________________

const dbconnect = async () => {
  await mongoose
    .connect(
      process.env.MONGO_URL,
      { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .then(() => {
      console.log("connected to Database");
    })
    .catch((error) => console.log(error));
};

dbconnect();


app.listen(process.env.PORT, () => {
  console.log("Server Started");
});
