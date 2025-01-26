const express = require('express');
const bcrypt = require('bcryptjs');
const { client } = require('../db');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();



app.post('/calculateGValues', authenticateToken, (req, res) => {
 const { dValues, rateValue } = req.body;

 if (!Array.isArray(dValues) || !Array.isArray(rateValue) || dValues.length !== rateValue.length) {
   return res.status(400).json({ error: 'Invalid input or mismatched arrays' });
 }

 const gValues = [];
 const interestValues = [];
 let previousGValue = 0;

 dValues.forEach((dValue, index) => {
   let rate = rateValue[index];

   if (rate >= 1) {
     rate = rate / 100;
   }

   const interest = (previousGValue + dValue) * rate;
   const gValue = previousGValue + dValue + interest;

   interestValues.push(interest);
   gValues.push(gValue);

   previousGValue = gValue;
 });

 res.json({ gValues, interestValues });
});

module.exports = router;