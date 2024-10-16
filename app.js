const express = require('express')
const app = express()
const morgan = require('morgan')
const bodyParser = require('body-parser')
const session = require('express-session');

//db con
const db = require("./models/connection_db")
db.connectDatabase()

// Session middleware configuration
app.use(session({
    secret: '2e4481b3e09eded61eeb77195796bdebbf22e2cb6089a7c71b06ee17ba1fe4dbd2525ba09a0fc8e007718d95602c0fe1346b501d7b55895b7918a57072ce424c', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
  }));

// routers
const prodRouter = require('./router/backend_router')
//setting for body-parser and morgan
app.use(morgan('dev'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "*")

    if (req.method === 'OPTIONS') {
        res.header("Access-Control-Allow-Methods", "*")
        return res.status(200).json({})
    }
    next()
})

app.use('/equipments', prodRouter)


//error middleware
app.use((req, res, next) => {
    const error = new Error('Not Found')
    error.status = 404
    next(error)
})

app.use((error, req, res, next) => {
    res.status(error.status || 500)
    res.json({
        error: {
            message: error.message
        }
    })
})

module.exports = app