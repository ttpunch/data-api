var express = require("express");
var router = express.Router();
const jwt = require('jsonwebtoken');
const user = require("../models/user.js");

const SecretKey="secretkey"
router.post('/', async (req, res) => {
  console.log(req.body)
    try {
      // Find the user with the specified email address
      const User = await user.findOne({ name: req.body.username });
      console.log(User)
      if (!User) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Verify the password
      if (User.password !== req.body.password) {
        return res.status(401).json({ message: 'Invalid password' });
      }
      // Generate a JWT token
      const token = jwt.sign({ userId: User.username }, SecretKey);
      console.log(token)
      res.status(200).json({ token });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

//Middleware for authenticating users with JWT tokens

const secretKey = 'mysecretkey';
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, secretKey);
      req.userId = decoded.userId;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
  } else {
    res.status(401).json({ message: 'Missing token' });
  }
};


module.exports = router;
