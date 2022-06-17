require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const mongoose = require('mongoose');

const subscribersRouter = require('./routes/subscribers');
const todosRouter = require('./routes/todos');
const usersRouter = require('./routes/users');

const app = express();

//middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/*
app.use(cors({
    credentials: true,
    origin: 'http://192.168.99.100:3000',
	optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));
*/
app.use(cors({
    credentials: true,
    origin: true
}))

app.use(cookieParser());
// HTTP request logger middleware for node.js
app.use(morgan('dev'));

app.use(express.static('build'));

//connect to db
mongoose.connect(process.env.DATABASE_URL
	, {useNewUrlParser: true, useUnifiedTopology: true})
	.then(res => console.log('connect to db ...'));


//routes
app.use('/api/users', usersRouter);
app.use('/api/todos', todosRouter);
app.use('/api/subscribers', subscribersRouter);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`server listening on ${PORT}`);
});