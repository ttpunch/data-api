const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const machine = require("./models/machine.js");
const express = require("express");
var cors = require('cors')
const app = express();
const dotenv=require('dotenv')

dotenv.config();

const formroute=require('./Router/FormRouter')
const searchroute=require('./Router/SearchRouter')
const bgroute=require('./Router/Bgroute')
const editFormRoute=require('./Router/editFormRoute')



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())
 
var corsOptions = {
  origin: 'https://data-api-d6lk.onrender.com',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

//Submit form Data 
app.use('/machinedata',cors(corsOptions),bgroute)
app.use('/submit-form',cors(corsOptions),formroute)
app.use('/machineroute',cors(corsOptions),searchroute)
app.use('/editdata/',cors(corsOptions),editFormRoute)
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
