const express = require('express');
const { client } = require('../../db');
 const crypto = require('crypto');
const router = express.Router();



router.post('/add-to-cart', async (req, res) => {
 try {
    console.log('🔹 Body received:', req.body); // Проверка, что приходит от клиента
    const { item_id, ingredients, quantity, category, price } = req.body;
    //  const { item_id, ingredients, quantity, category, price } = req.body;
     
     console.log('🍒 item_id -->', item_id);
     console.log('🍒 ingredients -->', ingredients);
     console.log('🍒 quantity -->', quantity);

     // Получаем токен из куки
     let token = req.cookies.cartToken;
     console.log('Cart Token:', token);

     // Если токена нет, генерируем новый
     if (!token) {
         console.log('No cart token provided');
         token = crypto.randomUUID(); // Генерация нового токена
         res.cookie('cartToken', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 }); // Устанавливаем токен в куки на 30 дней
         console.log('Generated and set new token in cookies:', token);
     }

     // Получаем userId, если пользователь авторизован, иначе null
     const userId = req.user?.id || null;

     // Проверяем, существует ли корзина с текущим токеном
     const selectQuery = `
         SELECT * FROM "cart" WHERE "token" = $1;
     `;
     const values = [token];
     const result = await client.query(selectQuery, values);

     console.log('Query Result:', result.rows);

     let cartId;

     if (result.rowCount === 0) {
         // Если корзины с таким токеном нет, создаем новую
         const insertQuery = `
             INSERT INTO "cart" ("token", "userid", "createdat", "updatedat")
             VALUES ($1, $2, NOW(), NOW())
             RETURNING *;
         `;
         const insertValues = [token, userId];
         const insertResult = await client.query(insertQuery, insertValues);

         console.log('New cart Created:', insertResult.rows[0]);
         cartId = insertResult.rows[0].id;
     } else {
         // Если корзина существует, получаем её id
         cartId = result.rows[0].id;
     }

     // Проверяем, есть ли уже элемент в CartItem с таким cartId, item_id и ingredients
     let checkItemQuery;
     let checkItemValues;

     if (!ingredients || ingredients.length === 0) {
         checkItemQuery = `
             SELECT * FROM "cart_items" 
             WHERE "cart_id" = $1 
             AND "item_id" = $2;
         `;
         checkItemValues = [cartId, item_id];
     } else {
         checkItemQuery = `
             SELECT * FROM "cart_items" 
             WHERE "cart_id" = $1 
             AND "item_id" = $2 
             AND "ingredients" = $3;
         `;
         checkItemValues = [cartId, item_id, ingredients];
     }

     const itemResult = await client.query(checkItemQuery, checkItemValues);
     console.log('Item Query Result:', itemResult.rows);

     if (itemResult.rowCount > 0) {
         // Если такой элемент существует, обновляем quantity
         const itemId = itemResult.rows[0].id;
         const oldQuantity = itemResult.rows[0].quantity;
         const newQuantity = quantity !== 1 ? quantity : oldQuantity + 1; // Увеличиваем количество

         const updateQuery = `
             UPDATE "cart_items" 
             SET "quantity" = $1, "updated_at" = NOW() 
             WHERE "id" = $2
             RETURNING *;
         `;
         const updateValues = [newQuantity, itemId];
         const updateResult = await client.query(updateQuery, updateValues);

         console.log('Updated cart_items:', updateResult.rows[0]);
         return res.status(200).json(updateResult.rows[0]);
     } else {
         // Если такого элемента нет, добавляем новый
         const insertItemQuery = `
             INSERT INTO "cart_items" ("cart_id", "item_id", "ingredients", "quantity", "created_at", "updated_at", "category", "price")
             VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6)
             RETURNING *;
         `;
         const insertItemValues = [cartId, item_id, ingredients, quantity, category, price];
         const insertItemResult = await client.query(insertItemQuery, insertItemValues);

         console.log('New CartItem Created:', insertItemResult.rows[0]);
         return res.status(201).json(insertItemResult.rows[0]);
     }
 } catch (error) {
     console.error('[CART_POST] Server error', error);
     return res.status(500).json({ message: 'Не удалось добавить элемент в корзину' });
 }
});

module.exports = router;
