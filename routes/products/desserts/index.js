const express = require('express');
const router = express.Router();
const {client} = require('../../../db');


router.get('/', async (req, res) => {
 try {
     // Получение всех пицц
     const dessertsQuery = `
         SELECT * FROM desserts;
     `;

     // Выполняем запросы
     const dessertsResult = await client.query(dessertsQuery);

     // Извлекаем строки из результатов запросов
     const desserts = dessertsResult.rows;
  console.log(desserts);
  
     // Собираем данные в нужный формат
     

     res.json(desserts);
 } catch (err) {
     console.error('Ошибка при получении drinks:', err);
     res.status(500).json({ message: 'Ошибка сервера' });
 }
});


module.exports = router;