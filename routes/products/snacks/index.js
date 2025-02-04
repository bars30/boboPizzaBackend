const express = require('express');
const router = express.Router();
const {client} = require('../../../db');


router.get('/', async (req, res) => {
 try {
     const snacksQuery = `
        SELECT * FROM snacks;
     `;
     const snacksResult = await client.query(snacksQuery);
     const snacks = snacksResult.rows;
     console.log(snacks);
  
     res.json(snacks);
 } catch (err) {
     console.error('Ошибка при получении snacks:', err);
     res.status(500).json({ message: 'Ошибка сервера' });
 }
});


module.exports = router;