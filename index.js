require('dotenv').config()
require('express-async-errors')
const express = require('express')
const redis = require('redis')
const PORT = process.env.PORT || 3001
const REDIS_PORT = process.env.REDIS_PORT || 6379
const client = redis.createClient({
  host: 'redis-server',
  port: 6379,
})

client.on('connect', () =>
  console.log(`Redis is connected on port ${REDIS_PORT}`)
)
client.on('error', (error) => console.error(error))

const cors = require('cors')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

const mongoose = require('mongoose')

const todosRouter = require('./routes/todos')
const usersRouter = require('./routes/users')

const app = express()

//middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

/*
app.use(cors({
    credentials: true,
    origin: 'http://192.168.99.100:3000',
	optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));
*/
app.use(
  cors({
    credentials: true,
    origin: true,
  })
)

app.use(cookieParser())
// HTTP request logger middleware for node.js
app.use(morgan('dev'))

app.use(express.static('build'))

let mongodbURI
if (process.env.NODE_ENV === 'test') {
  mongodbURI = process.env.TEST_DATABASE_URL //process.env.MONGODB_TEST_URI || process.env.TEST_DATABASE_URL
} else {
  mongodbURI = process.env.DATABASE_URL
}

const mongodb = mongoose.connect(mongodbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

//connect to db `mongodb://root:example@mongo:27017/`
mongodb
  .then(() => {
    if (!module.parent) {
      app.listen(app.get('port'), () => {})
    }
  })
  .catch((err) => console.error(err))

//routes
app.use('/api/users', usersRouter)
app.use('/api/todos', todosRouter)

app.listen(PORT, () => {
  console.log(`server listening on ${PORT}`)
})

module.exports = app
