const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const machine = require("./models/machine.js");
const express = require("express");
const app = express();
const dotenv = require('dotenv')

const cors = require('cors')

dotenv.config();

const formroute = require('./Router/FormRouter')
const searchroute = require('./Router/SearchRouter')
const bgroute = require('./Router/Bgroute')
const editFormRoute = require('./Router/editFormRoute')
const LoginRoute = require('./Router/LoginRouter')
const SearchRoute = require('./Router/searchDataRouter.js')
const imageuploader = require('./Router/imageUploadRoute.js')
const machineDetailsRoute = require('./Router/MachineDetailsRouter.js')


// Add Access Control Allow Origin headers
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(
  cors({
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
)

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//Submit form Data 
app.use('/api/machinedata', bgroute)
app.use('/api/submit-form', formroute)
app.use('/api/machineroute', searchroute)
app.use('/api/editdata', editFormRoute)
app.use('/api/login', LoginRoute)
app.use('/api/search', SearchRoute)
app.use('/api/image', imageuploader)
app.use('/api/machine-details', machineDetailsRoute)

// Serve Frontend Static Files
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Debug Route
app.get('/api/debug-env', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const rootDir = path.join(__dirname, '..');
  const frontendDir = path.join(rootDir, 'frontend');
  const buildDir = path.join(frontendDir, 'build');

  const info = {
    __dirname,
    rootDirContents: [],
    frontendDirContents: [],
    buildDirContents: [],
    buildIndexExists: false
  };

  try {
    if (fs.existsSync(rootDir)) info.rootDirContents = fs.readdirSync(rootDir);
    if (fs.existsSync(frontendDir)) info.frontendDirContents = fs.readdirSync(frontendDir);
    if (fs.existsSync(buildDir)) info.buildDirContents = fs.readdirSync(buildDir);
    info.buildIndexExists = fs.existsSync(path.join(buildDir, 'index.html'));
  } catch (e) {
    info.error = e.message;
  }
  res.json(info);
});

// Handle SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'), function (err) {
    if (err) {
      res.status(500).send(err);
    }
  });
});

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
  console.log(`Server Started on  ${process.env.PORT}`);
});
