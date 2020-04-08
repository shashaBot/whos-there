var express = require('express');
const session = require('express-session');
var path = require('path');
var compass = require('node-compass');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const dotenv = require('dotenv');
const passport = require('passport');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: '.env' });

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

/**
 * Connect to MongoDB.
 */
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 1209600000 }, // two weeks in milliseconds
  store: new MongoStore({
    url: process.env.MONGODB_URI,
    autoReconnect: true,
  })
}));

/**
 * Initialize passport
 */
require('./config/passport')(passport)
app.use(passport.initialize());
app.use(passport.session());

app.use(compass({ mode: 'expanded' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Routing
 */
app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
