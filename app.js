require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const {errors} = require('celebrate');
const mainRouter = require('./routes/index');
const errorHandler = require('./middlewares/error-handler');
const {requestLogger, errorLogger} = require('./middlewares/loggers')
const bodyParser = require("body-parser");


const app = express();
const {PORT= 3001} = process.env;

const corsOptions ={
    origin: ['https://www.finance-tracker.zanity.net', 'https://finance-tracker.zanity.net'], // Add allowed origins
    methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}

mongoose.set('strictQuery', true);

mongoose.connect('mongodb://127.0.0.1:27017/finance-tracker')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.on('error', err => {
    console.error('MongoDB connection error occurred:', err);
});

app.use(express.json());
app.options("*", cors());
app.use("*",cors(corsOptions));

app.use(bodyParser.json());

app.use(requestLogger);

app.use(helmet());

app.get('/crash-test', ()=>{
    setTimeout(()=>{
        throw new Error('Server will crash now');
    }, 0);
});

app.use("/", mainRouter);

app.use(errorLogger);

app.use(errors());

app.use(errorHandler);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: err.message });
  });

app.listen(PORT, ()=>console.log(`Server Started on port ${PORT}`));