require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');


const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const passwordRoutes = require('./routes/password');
const popupRoutes = require('./routes/popup');
const uploadRoutes = require('./routes/upload');

const pizzaRoutes = require('./routes/products/pizzas');
const drinkRoutes = require('./routes/products/drinks');

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

const corsOptions = {
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};

app.use(cors(corsOptions));


app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/password', passwordRoutes);
app.use('/popup', popupRoutes);
app.use('/upload', uploadRoutes);

app.use('/products/pizzas', pizzaRoutes);
app.use('/products/drinks', drinkRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
