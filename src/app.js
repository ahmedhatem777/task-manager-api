const express = require('express');
const cors = require('cors');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');
require('./db/mongoose');

const app = express();

const corsOptions = {
    credentials: true,
    origin: '*'
}
app.use(cors(corsOptions));
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

module.exports = app;

