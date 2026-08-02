require('dotenv').config();
require('./app_api/models/db');
const passport = require('passport');
const cors = require('cors');
require('./app_api/config/passport');
var createError = require('http-errors');
var express = require('express');
var hbs = require('hbs');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./app_server/routes/index');
var usersRouter = require('./app_server/routes/users');
var travelRouter = require('./app_server/routes/travel');
var roomsRouter = require('./app_server/routes/rooms');
var mealsRouter = require('./app_server/routes/meals');
var newsRouter = require('./app_server/routes/news');
var aboutRouter = require('./app_server/routes/about');
var contactRouter = require('./app_server/routes/contact');

var apiRouter = require('./app_api/routes/index');

var app = express();
app.use(passport.initialize());

app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'app_server', 'views', 'partials'));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cors({ origin: 'http://localhost:4200' }));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/travel', travelRouter);
app.use('/rooms', roomsRouter);
app.use('/meals', mealsRouter);
app.use('/news', newsRouter);
app.use('/about', aboutRouter);
app.use('/contact', contactRouter);

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.use('/api', apiRouter);

// An unmatched API path answers in JSON. Falling through to the HTML 404 below
// hands a browser page to a client that asked for data.
app.use('/api', function (req, res) {
  res.status(404).json({ message: 'Not found.' });
});

app.use(function (req, res, next) {
  next(createError(404));
});

// One error handler, and it never sends a stack trace to a client.
//
// The original file had two: a renderer that put err.stack into the page
// whenever NODE_ENV was not production, followed by a handler meant to turn JWT
// failures into JSON. Express runs error handlers in registration order and the
// renderer never called next(), so the JSON handler was unreachable. Every
// unauthenticated API request came back as an HTML page containing absolute
// filesystem paths and the dependency tree. Order was the whole bug.
app.use(function (err, req, res, next) {
  const status = err.status || (err.name === 'UnauthorizedError' ? 401 : 500);

  // the operator gets the detail, the client does not
  if (status >= 500) console.error(err);

  if (req.originalUrl.startsWith('/api')) {
    return res.status(status).json({
      message: status >= 500 ? 'Internal server error.' : err.message,
    });
  }

  res.status(status);
  res.locals.message = status >= 500 ? 'Something went wrong.' : err.message;
  res.locals.error = {};
  res.render('error');
});

module.exports = app;
