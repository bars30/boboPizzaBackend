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
const dessertsRoutes = require('./routes/products/desserts');
const breakfastsRoutes = require('./routes/products/breakfasts');
const snacksRoutes = require('./routes/products/snacks');

const cartRoutes = require('./routes/card');


const app = express();
app.use(bodyParser.json());
app.use(cookieParser());


const corsOptions = {
    origin: 'http://localhost:4200', // Разрешить только с этого домена
    credentials: true,  // Разрешить передачу куков
};

app.use(cors(corsOptions));


app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/password', passwordRoutes);
app.use('/popup', popupRoutes);
app.use('/upload', uploadRoutes);

app.use('/products/pizzas', pizzaRoutes);
app.use('/products/drinks', drinkRoutes);
app.use('/products/desserts', dessertsRoutes);
app.use('/products/breakfasts', breakfastsRoutes);
app.use('/products/snacks', snacksRoutes);

app.use('/cart', cartRoutes);
app.use(express.json()); // Добавляет поддержку JSON
app.use(express.urlencoded({ extended: true })); // Если используешь `x-www-form-urlencoded`


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
