const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');

// Load your certificates and private key from the OpenSSL folder
const privateKeyPath = path.resolve('./OpenSSL/key.pem');
const certificatePath = path.resolve('./OpenSSL/cert.pem');

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const certificate = fs.readFileSync(certificatePath, 'utf8');

// Log the paths and the first few characters of the key and certificate to verify they are read correctly
console.log(`Private Key Path: ${privateKeyPath}`);
console.log(`Certificate Path: ${certificatePath}`);
console.log(`Private Key (first 100 chars): ${privateKey.substring(0, 100)}`);
console.log(`Certificate (first 100 chars): ${certificate.substring(0, 100)}`);

const credentials = {
    key: privateKey,
    cert: certificate,
    passphrase: 'digitalCertificate0511' // Replace with your actual passphrase
};

const app = express();

//db con
const db = require("./models/connection_db");
db.connectDatabase();

// Session middleware configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // Set to true for HTTPS
        httpOnly: true,
        sameSite: 'none',
        maxAge: 300000
    }
}));

// routers
const prodRouter = require('./router/backend_router');
//setting for body-parser and morgan
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://127.0.0.1:5500"); // Specify the allowed origin
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true"); // Allow credentials

    if (req.method === 'OPTIONS') {
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        return res.status(200).json({});
    }
    next();
});

app.use('/equipments', prodRouter);

//error middleware
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

module.exports = { app, credentials };