const express = require('express');
const bcrypt = require('bcryptjs');
const { client } = require('../db');
const nodemailer = require('nodemailer'); // Include this if missing

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }, 
});
 
const verificationCodes = {}; // Move this inside if it's not global.

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000); 
        console.log(resetCode);
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset',
            text: `Your password reset code: ${resetCode}`,
        });

        verificationCodes[email] = resetCode;

        return res.status(200).json({ message: 'Password reset code sent to your email.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error sending the code.' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    const normalizedEmail = email.toLowerCase();

    if (verificationCodes[normalizedEmail] && verificationCodes[normalizedEmail].toString() === code.toString()) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        try {
            await client.query(
                'UPDATE users SET password = $1 WHERE email = $2',
                [hashedPassword, normalizedEmail]
            );

            delete verificationCodes[normalizedEmail]; 
            return res.status(200).json({ message: 'Password successfully reset!' });
        } catch (error) {
            console.error('Error updating password:', error);
            return res.status(500).json({ error: 'Error resetting password.' });
        }
    } else {
        return res.status(400).json({ error: 'Invalid password reset code.' });
    }
});

module.exports = router;
