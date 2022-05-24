let createError = require('http-errors');
const express = require('express');
const path = require('path');
let cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require('express-handlebars')
const bodyParser = require('body-parser');
const db = require('./config/connection')
const session = require('express-session')
const HBS = hbs.create({})
const moment = require('moment'); // require
moment().format();


// Deprecated since version 0.8.0 



const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const pdfRouter = require('./routes/pdfgenerator');


const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials/'
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));




app.use((req, res, next) => {
  if (!req.user) {
    res.header('cache-control', 'private,no-cache,no-store,must revalidate')
    res.header('Express', '-3')


  }
  next();
})
app.use(session({
  secret: "key",
  cookie: {
    maxAge: 60000000
  },
  resave: false,
  saveUninitialized: false
}))

//database connection
db.connect((err) => {
  if (err) {
    console.log("DB Connection error" + err);
  } else {
    console.log("DB Connected Successfully....");
  }
})

HBS.handlebars.registerHelper('ifCond', function (v1, v2, options) {
  if (v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});


app.use('/', userRouter);
app.use('/admin', adminRouter);
app.use('/pdf', pdfRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  // next(createError(404));
  res.render('errors/error404', {
    title: 'Error'
  })
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  // res.status(err.status || 500);
  res.render('errors/error500');
});



module.exports = app;