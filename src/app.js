const express = require('express');
const cors = require('cors');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');
require('./db/mongoose');

const app = express();

// Specifying cors options (origin)
const corsOptions = {
    credentials: true,
    origin: 'https://tt-front-end.vercel.app'
}

app.use(cors(corsOptions)); 
app.options('*', cors());
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

module.exports = app;

