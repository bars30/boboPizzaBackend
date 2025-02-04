const express = require('express');
const router = express.Router();
const {client} = require('../../../db');


router.get('/', async (req, res) => {
 try {
     // Получение всех пицц
     const pizzasQuery = `
         SELECT * FROM drinks
     `;
     const variationsQuery = `
         SELECT * FROM drinks_variations
     `;

     // Выполняем запросы
     const drinksResult = await client.query(pizzasQuery);
     const variationsResult = await client.query(variationsQuery);

     // Извлекаем строки из результатов запросов
     const drinks = drinksResult.rows;
     const variations = variationsResult.rows;
  console.log(drinks);
console.log(variations);
  
     // Собираем данные в нужный формат
     const result = drinks.map(drinks => {
      console.log("🟠", variations);
      
         const drinksVariations = variations.filter(v => v.drink_id === drinks.id);
 console.log("🥎", drinksVariations);
 

         return {
             name: drinks.name,
             description: drinks.description,
             variations: drinksVariations.map(variation => ({
                 volume_ml: variation.volume_ml,
                 price: variation.price,
                 is_available: variation.is_available,
                 image_url: variation.image_url,
             })),
         };
     });

     res.json(result);
 } catch (err) {
     console.error('Ошибка при получении drinks:', err);
     res.status(500).json({ message: 'Ошибка сервера' });
 }
});


module.exports = router;