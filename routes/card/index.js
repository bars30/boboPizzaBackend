const express = require('express');
const { client } = require('../../db');
 const crypto = require('crypto');
const { log } = require('console');
const router = express.Router();

// router.get('/', async (req, res) => {
//     try {
//         let token = req.cookies.cartToken;
//         if (!token) {
//             token = crypto.randomUUID();
//             res.cookie('cartToken', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
//         }

//         const selectQuery = `SELECT * FROM "cart" WHERE "token" = $1;`;
//         const cartResult = await client.query(selectQuery, [token]);
//         console.log(cartResult.rows[0].id);

//         if (cartResult.rowCount === 0) {
//             return res.status(404).json({ error: 'Cart not found for this token.' });
//         }

//         const cartId = cartResult.rows[0].id;
//         const itemsQuery = `SELECT * FROM "cart_items" WHERE "cart_id" = $1;`;
//         const itemsResult = await client.query(itemsQuery, [cartId]);

//         res.status(200).json(itemsResult.rows);  // Возвращаем все товары в корзине
//     } catch (error) {
//         res.status(500).json({ error: 'Error fetching cart items.' });
//     }
// });

router.get('/', async (req, res) => {
    try {
        let token = req.cookies.cartToken;
        if (!token) {
            token = crypto.randomUUID();
            res.cookie('cartToken', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
        }

        const selectQuery = `SELECT * FROM "cart" WHERE "token" = $1;`;
        const cartResult = await client.query(selectQuery, [token]);

        if (cartResult.rowCount === 0) {
            return res.status(404).json({ error: 'Cart not found for this token.' });
        }

        const cartId = cartResult.rows[0].id;
        const itemsQuery = `SELECT * FROM "cart_items" WHERE "cart_id" = $1;`;
        const itemsResult = await client.query(itemsQuery, [cartId]);

        const updatedItems = await Promise.all(itemsResult.rows.map(async (item) => {
            let itemDetails = { ...item };
        
            if (item.category === 'drinks') {
                const drinkVariationQuery = `SELECT * FROM "drinks_variations" WHERE "id" = $1;`;
                const drinkVariationResult = await client.query(drinkVariationQuery, [item.item_id]);
        
                if (drinkVariationResult.rowCount > 0) {
                    const drinkVariation = drinkVariationResult.rows[0];
                    const drinkQuery = `SELECT * FROM "drinks" WHERE "id" = $1;`;
                    const drinkResult = await client.query(drinkQuery, [drinkVariation.drink_id]);
        
                    if (drinkResult.rowCount > 0) {
                        const drink = drinkResult.rows[0];
                        itemDetails.drink = drink.name;
                        itemDetails.volume_ml = drinkVariation.volume_ml;
                        itemDetails.image_url = drinkVariation.image_url;
                        itemDetails.price = drinkVariation.price;
                    }
                }
            } else if (item.category === 'pizzas') {
                const pizzaVariationQuery = `SELECT * FROM "pizza_variations" WHERE "id" = $1;`;
                const pizzaVariationResult = await client.query(pizzaVariationQuery, [item.item_id]);
        
                if (pizzaVariationResult.rowCount > 0) {
                    const pizzaVariation = pizzaVariationResult.rows[0];
                    const pizzaQuery = `SELECT * FROM "pizzas" WHERE "id" = $1;`;
                    const pizzaResult = await client.query(pizzaQuery, [pizzaVariation.pizza_id]);
        
                    if (pizzaResult.rowCount > 0) {
                        const pizza = pizzaResult.rows[0];
                        itemDetails.pizza_name = pizza.name;
                        itemDetails.crust_type = pizzaVariation.crust_type;
                        itemDetails.size_cm = pizzaVariation.size_cm;
                        itemDetails.image_url = pizzaVariation.image_url;
                        itemDetails.price = pizzaVariation.price;
                    }
                }
            } else if (['desserts', 'snacks', 'breakfasts'].includes(item.category)) {
                const tableName = item.category; // Название таблицы соответствует категории
                const itemQuery = `SELECT * FROM "${tableName}" WHERE "id" = $1;`;
                const itemResult = await client.query(itemQuery, [item.item_id]);
        
                if (itemResult.rowCount > 0) {
                    const itemData = itemResult.rows[0];
                    itemDetails.name = itemData.name;
                    itemDetails.image_url = itemData.image_url;
                    itemDetails.price = itemData.price;
                    itemDetails.pieces = itemData.pieces;
                }
            }
        
            return itemDetails;
        }));
        

        res.status(200).json(updatedItems);  // Возвращаем все товары с добавленными данными
    } catch (error) {
        console.error('[CART_GET] Server error', error);
        return res.status(500).json({ error: 'Error fetching cart items.' });
    }
});


// router.post('/add-to-cart', async (req, res) => {
//     try {
//         console.log('🛒 Received body:', req.body);
//         console.log('🔹 Body received:', req.body);
//         const { item_id, category, quantity, price, subtotal, ingredients } = req.body;

//         console.log('🍒 item_id -->', item_id);
//         console.log('🍒 category -->', category);
//         console.log('🍒 quantity -->', quantity);

//         let token = req.cookies.cartToken;
//         if (!token) {
//             token = crypto.randomUUID();
//             res.cookie('cartToken', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
//         }

//         const userId = req.user?.id || null;
        
//         const selectQuery = `SELECT * FROM "cart" WHERE "token" = $1;`;
//         const cartResult = await client.query(selectQuery, [token]);

//         let cartId = cartResult.rowCount === 0 ? 
//             (await client.query(`INSERT INTO "cart" ("token", "userid", "createdat", "updatedat") VALUES ($1, $2, NOW(), NOW()) RETURNING *;`, [token, userId])).rows[0].id 
//             : cartResult.rows[0].id;

//         let checkItemQuery = `SELECT * FROM "cart_items" WHERE "cart_id" = $1 AND "item_id" = $2`;
//         let checkItemValues = [cartId, item_id];

//         if (['pizza', 'drinks'].includes(category) && ingredients) {
//             checkItemQuery += ' AND "ingredients" = $3';
//             checkItemValues.push(ingredients);
//         }

//         const itemResult = await client.query(checkItemQuery, checkItemValues);
        
//         if (itemResult.rowCount > 0) {
//             const itemId = itemResult.rows[0].id;
//             const newQuantity = quantity !== 1 ? quantity : itemResult.rows[0].quantity + 1;
//             const updateResult = await client.query(
//                 `UPDATE "cart_items" SET "quantity" = $1, "updated_at" = NOW() WHERE "id" = $2 RETURNING *;`,
//                 [newQuantity, itemId]
//             );
//             return res.status(200).json(updateResult.rows[0]);
//         } else {
//             console.log('🛒 SQL INSERT category:', category);

//             const insertItemResult = await client.query(
//                 `INSERT INTO "cart_items" ("cart_id", "item_id", "category", "quantity", "price", "subtotal", "ingredients", "created_at", "updated_at") 
//                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *;`,
//                 [cartId, item_id, category, quantity, price, subtotal, ingredients || null]
//             );
//             console.log('✅ Inserted item:', insertItemResult.rows[0]);

//             return res.status(201).json(insertItemResult.rows[0]);
//         }
//     } catch (error) {
//         console.error('[CART_POST] Server error', error);
//         return res.status(500).json({ message: 'Не удалось добавить элемент в корзину' });
//     }
// });

router.post('/add-to-cart', async (req, res) => {
    try {
        console.log('🛒 Received body:', req.body);
        const { item_id, category, quantity, price, subtotal, ingredients } = req.body;

        console.log(`🍒 Новый товар: item_id=${item_id}, category=${category}, quantity=${quantity}, price=${price}`);

        let token = req.cookies.cartToken;
        if (!token) {
            token = crypto.randomUUID();
            res.cookie('cartToken', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
            console.log('🆕 Новый cartToken создан:', token);
        } else {
            console.log('🔑 Существующий cartToken:', token);
        }

        const userId = req.user?.id || null;

        console.log('🔍 Проверяем корзину по токену:', token);
        const selectQuery = `SELECT * FROM "cart" WHERE "token" = $1;`;
        const cartResult = await client.query(selectQuery, [token]);

        let cartId;
        if (cartResult.rowCount === 0) {
            console.log('🆕 Создаем новую корзину');
            const insertCartQuery = `INSERT INTO "cart" ("token", "userid", "createdat", "updatedat") VALUES ($1, $2, NOW(), NOW()) RETURNING *;`;
            const insertCartResult = await client.query(insertCartQuery, [token, userId]);
            cartId = insertCartResult.rows[0].id;
            console.log('✅ Корзина создана с ID:', cartId);
        } else {
            cartId = cartResult.rows[0].id;
            console.log('✅ Найдена существующая корзина с ID:', cartId);
        }

        let checkItemQuery = `SELECT * FROM "cart_items" WHERE "cart_id" = $1 AND "item_id" = $2`;
        let checkItemValues = [cartId, item_id];

        if (['pizza', 'drinks'].includes(category) && ingredients) {
            checkItemQuery += ' AND "ingredients" = $3';
            checkItemValues.push(ingredients);
        }

        console.log('🔍 Проверяем товар в корзине:', { cartId, item_id, category, ingredients });
        console.log('🔍 SQL:', checkItemQuery, checkItemValues);
        const itemResult = await client.query(checkItemQuery, checkItemValues);

        if (itemResult.rowCount > 0) {
            const itemId = itemResult.rows[0].id;
            const newQuantity = quantity !== 1 ? quantity : itemResult.rows[0].quantity + 1;
            console.log('🔄 Обновляем товар:', { itemId, newQuantity, category });

            const updateResult = await client.query(
                `UPDATE "cart_items" SET "quantity" = $1, "category" = $2, "updated_at" = NOW() WHERE "id" = $3 RETURNING *;`,
                [newQuantity, category, itemId]
            );
            console.log('✅ Товар обновлен:', updateResult.rows[0]);
            return res.status(200).json(updateResult.rows[0]);
        } else {
            console.log('➕ Добавляем новый товар в корзину:', { cartId, item_id, category, quantity, price, subtotal, ingredients });

            const insertItemResult = await client.query(
                `INSERT INTO "cart_items" ("cart_id", "item_id", "category", "quantity", "price", "subtotal", "ingredients", "created_at", "updated_at") 
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *;`,
                [cartId, item_id, category, quantity, price, subtotal, ingredients || null]
            );

            console.log('✅ Товар успешно добавлен:', insertItemResult.rows[0]);
            return res.status(201).json(insertItemResult.rows[0]);
        }
    } catch (error) {
        console.error('[CART_POST] ❌ Ошибка сервера:', error);
        return res.status(500).json({ message: 'Не удалось добавить элемент в корзину' });
    }
});

router.post('/delete-cart-item', async (req, res) => {
    try {
        const { id } = req.body;
        console.log(req.body);
        
        const token = req.cookies.cartToken;
        console.log('Cart Token:', token);
   
        if (!token) {
            // return res.status(400).json({ message: 'No cart token provided' });
    }

    if (!id) {
        return res.status(400).json({ message: 'Invalid input: id and quantity are required' });
    }

    const query = `
        DELETE FROM "cart_items"
        WHERE id = $1;  
    `;

    const values = [id];
    
    const result = await client.query(query, values); // Assuming `db.query` is your database query method
    

    console.log('Deleted CartItem:', result.rows[0]);
    return res.status(200).json({ message: 'Item deleted successfully', cartItem: result.rows[0] });
    }catch (error) {
        console.error('[CART_GET] Server error', error);
        return res.status(500).json({ message: 'Не удалось delete ' });
    }
})



module.exports = router;
