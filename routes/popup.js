const express = require('express');
const { client } = require('../db');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();


router.get('/popupinfo/:userId', async (req, res) => {
 const userId = req.params.userId; // ID пользователя из параметров URL
 const { interests } = req.body; // Массив идентификаторов интересов, которые выбрал пользователь
 console.log(userId);
 console.log(req.body);


 try {
     const result = await client.query(
         `SELECT popupInfo 
         FROM users 
         WHERE id = ${userId};`
     )

     // Если все вставки прошли успешно, подтверждаем транзакцию
     await client.query('COMMIT');
     res.status(200).json(result.rows[0].popupinfo);
     res.status(200).json({ message: 'Интересы пользователя успешно сохранены' });

 } catch (err) {
     console.error('Error fetching popupInfo:', err.message);
     res.status(500).json({ message: 'Server error', error: err.message });
 }
});

router.post('/popupinfo/:userId', async (req, res) => {
 const userId = req.params.userId; // ID пользователя из параметров URL
 const { popupInfo } = req.body; // Новое значение для popupInfo

 console.log(`Updating popupInfo for user ID: ${userId}`);
 console.log(`New popupInfo value: ${popupInfo}`);

 try {
     // SQL-запрос для обновления popupInfo
     const result = await client.query(
         `UPDATE users
         SET popupInfo = $1
         WHERE id = $2
         RETURNING popupInfo`,
         [popupInfo, userId]
     );

     if (result.rows.length > 0) {
         res.status(200).json({ 
             message: 'popupInfo updated successfully', 
             popupInfo: result.rows[0].popupinfo 
         });
     } else {
         res.status(404).json({ message: 'User not found or no changes made' });
     }
 } catch (err) {
     console.error('Error updating popupInfo:', err.message);
     res.status(500).json({ message: 'Server error', error: err.message });
 }
});


module.exports = router;








