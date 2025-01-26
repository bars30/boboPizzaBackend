const express = require('express');
const { client } = require('../db');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.get('/addUserInfo', authenticateToken, async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM users');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users.' });
    }
});

router.put('/user/update/:userId', async (req, res) => {
    console.log(req.body);
    
    const userId = req.params.userId;
    const { name_or_nickname, gender, seeking, birthday, hometown, details, ideal_partner, profile_photo } = req.body;
    const interests = req.body.interests; // Массив интересов, выбранных пользователем
    console.log(name_or_nickname);
    console.log(gender);
    console.log(seeking);
    
    
    
    console.log("44");
    console.log(interests);

    // Логируем userId и тело запроса для отладки
    console.log(`Updating user with ID: ${userId}`);
    console.log(req.body);

    try {
        // 1. Обновляем данные пользователя в таблице users
        const result = await client.query(
            'UPDATE users SET name_or_nickname = $1, gender = $2, seeking = $3, birthday = $4, hometown = $5, details = $6, ideal_partner = $7, profile_photo = $8 WHERE id = $9',
            [
                name_or_nickname, 
                gender, 
                seeking, 
                birthday, 
                hometown, 
                details, 
                ideal_partner, 
                profile_photo, 
                userId
            ]
        );

        // Проверяем, были ли обновлены данные
        if (result.rowCount > 0) {
            console.log('User updated successfully');
        } else {
            console.log('User not found or no changes made');
            return res.status(404).json({ message: 'User not found or no changes made' });
        }

        // 2. Начинаем транзакцию для работы с интересами
        await client.query('BEGIN');

        // 3. Удаляем все старые интересы для данного пользователя
        await client.query(
            'DELETE FROM user_interests WHERE user_id = $1',
            [userId]
        );

        // 4. Добавляем новые интересы
        for (let interestId of interests) {
            await client.query(
                `INSERT INTO user_interests (user_id, interest_id)
                 VALUES ($1, $2)
                 ON CONFLICT (user_id, interest_id) DO NOTHING`, // Игнорируем дубли
                [userId, interestId]
            );
        }

        // Если все прошло успешно, подтверждаем транзакцию
        await client.query('COMMIT');
        res.status(200).json({ message: 'User and interests updated successfully' });

    } catch (err) {
        // В случае ошибки откатываем транзакцию
        await client.query('ROLLBACK');
        console.error('Error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});



router.post('/user/:userId/interests', async (req, res) => {
    const userId = req.params.userId; // ID пользователя из параметров URL
    const { interests } = req.body; // Массив идентификаторов интересов, которые выбрал пользователь

    try {
        // Начинаем транзакцию
        await client.query('BEGIN');

        // Проходим по каждому интересу и вставляем в таблицу user_interests
        for (let interestId of interests) {
            await client.query(
                `INSERT INTO user_interests (user_id, interest_id)
                 VALUES ($1, $2)
                 ON CONFLICT (user_id, interest_id) DO NOTHING`, // Игнорируем дубли
                [userId, interestId]
            );
        }

        // Если все вставки прошли успешно, подтверждаем транзакцию
        await client.query('COMMIT');
        res.status(200).json({ message: 'Интересы пользователя успешно сохранены' });

    } catch (err) {
        // В случае ошибки откатываем транзакцию
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Ошибка при сохранении интересов пользователя', error: err.message });
    }
});





module.exports = router;
