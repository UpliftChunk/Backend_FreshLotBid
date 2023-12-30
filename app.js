const express = require('express');
const app = express();

// cors is used for intercommunication between urls
const cors = require('cors');
app.use(cors());

const ErrorMiddleware = require('./middleware/error')
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');


// use middlewares
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({useTempFiles: true}));



// ... Route imports
const lot= require('./route/LotRoute');
const user= require('./route/userRoute');

// ... implementation

// .. setting head path + route
app.use('/api/v1',lot);
app.use('/api/v1',user);

// use error handler middleware
app.use(ErrorMiddleware); 

module.exports = app;