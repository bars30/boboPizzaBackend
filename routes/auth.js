const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { client } = require('../db');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        await client.query('INSERT INTO refresh_tokens (token, user_id) VALUES ($1, $2)', [refreshToken, user.id]);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ accessToken });
    } catch (err) {
        res.status(500).json({ error: 'Login error', details: err.message });
    }
});

router.post('/logout', async (req, res) => {
    const { refreshToken } = req.cookies;
    if (refreshToken) await client.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

    res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.json({ message: 'Logged out successfully' });
});

router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token missing' });

    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const result = await client.query('SELECT * FROM refresh_tokens WHERE token = $1', [refreshToken]);
        if (result.rows.length === 0) return res.status(403).json({ error: 'Invalid refresh token' });

        const newAccessToken = jwt.sign({ id: payload.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ accessToken: newAccessToken });
    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired refresh token', details: err.message });
    }
});



router.post('/register', async (req, res) => {
 const { email, password } = req.body;

 try {
     let result = await client.query('SELECT * FROM users WHERE email = $1', [email]);

     if (result.rows.length === 0) {
         const hashedPassword = await bcrypt.hash(password, 10);
         await client.query(
             'INSERT INTO users (email, password) VALUES ($1, $2)',
             [email, hashedPassword]
         );

         result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
     }

     const user = result.rows[0];
     const validPassword = await bcrypt.compare(password, user.password);

     if (!validPassword) {
         return res.status(400).json({ error: 'Invalid password' });
     }

     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
     res.json({ token, id: user.id });
 } catch (err) {
     res.status(500).json({ error: 'Login error', details: err.message });
 }
});

module.exports = router;
