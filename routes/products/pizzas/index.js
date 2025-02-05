const express = require('express');
const router = express.Router();
const {client} = require('../../../db'); 
// Обработчик для получения всех пицц с их вариациями и ингредиентами
// router.get('/', async (req, res) => {
//  console.log("🎿🎿🎿");
 
//     try {
//         // Получение всех пицц
//         const pizzasQuery = `
//             SELECT * FROM pizzas
//         `;
//         const variationsQuery = `
//             SELECT * FROM pizza_variations
//         `;
//         const ingredientsQuery = `
//             SELECT * FROM ingredients
//         `;

//         const [pizzas] = await client.query(pizzasQuery);
//         const [variations] = await client.query(variationsQuery);
//         const [ingredients] = await client.query(ingredientsQuery);

//         // Собираем данные в нужный формат
//         const result = pizzas.map(pizza => {
//             const pizzaVariations = variations.filter(v => v.pizza_id === pizza.id);
//             const pizzaIngredients = (pizza.ingredients || []).map(ingredientId =>
//                 ingredients.find(ingredient => ingredient.id === ingredientId)
//             );

//             return {
//                 name: pizza.name,
//                 description: pizza.description,
//                 status: pizza.status,
//                 ingredients: pizzaIngredients,
//                 variations: pizzaVariations.map(variation => ({
//                     crust_type: variation.crust_type,
//                     size_cm: variation.size_cm,
//                     price: variation.price,
//                     is_available: variation.is_available,
//                     image_url: variation.image_url,
//                 })),
//             };
//         });

//         res.json(result);
//     } catch (err) {
//         console.error('Ошибка при получении пицц:', err);
//         res.status(500).json({ message: 'Ошибка сервера' });
//     }
// });

router.get('/', async (req, res) => {
 try {
     // Получение всех пицц
     const pizzasQuery = `
         SELECT * FROM pizzas
     `;
     const variationsQuery = `
         SELECT * FROM pizza_variations
     `;
     const ingredientsQuery = `
         SELECT * FROM ingredients
     `;

     // Выполняем запросы
     const pizzasResult = await client.query(pizzasQuery);
     const variationsResult = await client.query(variationsQuery);
     const ingredientsResult = await client.query(ingredientsQuery);

     // Извлекаем строки из результатов запросов
     const pizzas = pizzasResult.rows;
     const variations = variationsResult.rows;
     const ingredients = ingredientsResult.rows;

     // Собираем данные в нужный формат
     const result = pizzas.map(pizza => {
         const pizzaVariations = variations.filter(v => v.pizza_id === pizza.id);
         const pizzaIngredients = (pizza.ingredients || []).map(ingredientId =>
             ingredients.find(ingredient => ingredient.id === ingredientId)
         );

         return {
             name: pizza.name,
             description: pizza.description,
             status: pizza.status,
             ingredients: pizzaIngredients,
             variations: pizzaVariations.map(variation => ({
                 crust_type: variation.crust_type,
                 size_cm: variation.size_cm,
                 price: variation.price,
                 is_available: variation.is_available,
                 image_url: variation.image_url,
                 id: variation.id
             })),
         };
     });

     res.json(result);
 } catch (err) {
     console.error('Ошибка при получении пицц:', err);
     res.status(500).json({ message: 'Ошибка сервера' });
 }
});


module.exports = router;
