require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const {errors} = require('celebrate');
const mainRouter = require('./routes/index');
const errorHandler = require('./middlewares/error-handler');
const {requestLogger, errorLogger} = require('./middlewares/loggers')
const bodyParser = require("body-parser");


const app = express();
const {PORT= 3001} = process.env;

mongoose.set('strictQuery', true);

mongoose
    .connect('mongodb://localhost:27017/finance-tracker')
    .catch(console.error);

app.use(express.json());

app.use(cors());

app.use(bodyParser.json());

app.use(requestLogger);

app.get('/crash-test', ()=>{
    setTimeout(()=>{
        throw new Error('Server will crash now');
    }, 0);
});

app.use("/", mainRouter);

app.use(errorLogger);

app.use(errors());

app.use(errorHandler);

app.listen(PORT, ()=>console.log(`Server Started on port ${PORT}`));