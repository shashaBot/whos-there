const express = require('express');
const session = require('express-session');
const path = require('path');
const sass = require('node-sass-middleware');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const dotenv = require('dotenv');
const passport = require('passport');
const lusca = require('lusca');
const compression = require('compression');
const errorHandler = require('errorhandler');
const flash = require('express-flash');
const chalk = require('chalk');
/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: '.env' });

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const pagesRouter = require('./routes/pages');

const app = express();

app.set('view engine', 'pug');
app.set('views', './views');

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

app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
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
require('./config/passport')(passport);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user
    && req.path !== '/login'
    && req.path !== '/signup'
    && !req.path.match(/\./)) {
    req.session.returnTo = req.originalUrl;
  } else if (req.user
    && (req.path === '/account')) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});

/**
 * Routing
 */
app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/page', (req, res) => res.sendFile(path.join(__dirname, 'public/page.html')));
app.use('/pages', pagesRouter);

/**
 * Static assets
 */
app.use(express.static(path.join(__dirname, 'public')));
app.use('/javascripts/lib', express.static(path.join(__dirname, 'node_modules/socket.io-client/dist'), { maxAge: 31557600000 }));
app.use('/javascripts/lib', express.static(path.join(__dirname, 'node_modules/chart.js/dist'), { maxAge: 31557600000 }));
app.use('/javascripts/lib', express.static(path.join(__dirname, 'node_modules/popper.js/dist/umd'), { maxAge: 31557600000 }));
app.use('/javascripts/lib', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js'), { maxAge: 31557600000 }));
app.use('/javascripts/lib', express.static(path.join(__dirname, 'node_modules/jquery/dist'), { maxAge: 31557600000 }));
app.use('/webfonts', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts'), { maxAge: 31557600000 }));

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
} else {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Server Error');
  });
}

module.exports = app;
