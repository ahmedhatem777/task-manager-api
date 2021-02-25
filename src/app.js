const express = require('express');
const cors = require('cors');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');
require('./db/mongoose');

const app = express();

const corsOptions = {
    credentials: true,
    origin: 'https://tt.ahmed-hatem.com'
}

app.use(cors(corsOptions)); 
app.options('*', cors());
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

module.exports = app;

