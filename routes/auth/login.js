const express = require('express');
const { client } = require('../../db'); 
const nodemailer = require('nodemailer');

const router = express.Router();

// Настройка транспорта для отправки почты
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


const generateResetCode = () => Math.floor(100000 + Math.random() * 900000);


router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const resetCode = generateResetCode();
        console.log(`Generated Reset Code: ${resetCode}`);

        await client.query(
            `INSERT INTO verification_codes (code, email, created_at) VALUES ($1, $2, NOW())`,
            [resetCode, email]
        );

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset',
            text: `Your password reset code: ${resetCode}`,
        });

        res.json({ message: 'Reset code sent successfully' });

    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});


router.post('/request-new-code', async (req, res) => {
 try {
     const { email } = req.body;

     if (!email) {
         return res.status(400).json({ error: 'Email is required' });
     }

     await client.query(
         `DELETE FROM verification_codes WHERE email = $1`,
         [email]
     );


     const result = await client.query(
         `SELECT created_at FROM verification_codes WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
         [email]
     );

     if (result.rows.length > 0) {
         const lastCreatedAt = new Date(result.rows[0].created_at);
         const now = new Date();


         if ((now - lastCreatedAt) / 1000 < 60) {
             return res.status(429).json({ error: 'Wait 1 minute before requesting a new code' });
         }
     }


     const resetCode = generateResetCode();
     console.log(`New Reset Code: ${resetCode}`);

     await client.query(
         `INSERT INTO verification_codes (code, email, created_at) VALUES ($1, $2, NOW())`,
         [resetCode, email]
     );

     await transporter.sendMail({
         from: process.env.EMAIL_USER,
         to: email,
         subject: 'New Password Reset Code',
         text: `Your new password reset code: ${resetCode}`,
     });

     res.json({ message: 'New reset code sent successfully' });

 } catch (err) {
     console.error('Error:', err);
     res.status(500).json({ error: 'Server error', details: err.message });
 }
});


module.exports = router;
