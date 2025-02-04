const express = require('express');
const router = express.Router();
const {client} = require('../../../db');


router.get('/', async (req, res) => {
 try {
     // Получение всех пицц
     const breakfastsQuery = `
        SELECT * FROM breakfasts;
     `;

     // Выполняем запросы
     const breakfastsResult = await client.query(breakfastsQuery);

     // Извлекаем строки из результатов запросов
     const breakfasts = breakfastsResult.rows;
  console.log(breakfasts);
  
     // Собираем данные в нужный формат
     

     res.json(breakfasts);
 } catch (err) {
     console.error('Ошибка при получении drinks:', err);
     res.status(500).json({ message: 'Ошибка сервера' });
 }
});


module.exports = router;