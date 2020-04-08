const express = require('express');
const router = express.Router();
const path = require('path')

const passport = require('passport');
const validator = require('validator');
const User = require('../models/User');
const { JSONResponse } = require('../helpers');

/**
 * GET /login
 * Login page.
 */
router.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

/**
 * POST /login
 * Sign in using email and password.
 */
router.post('/login', (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' });
  if (validator.isEmpty(req.body.password)) validationErrors.push({ msg: 'Password cannot be blank.' });

  if (validationErrors.length) {
    let data = {
      errors: validationErrors
    }
    return JSONResponse(res, 'UNAUTHORIZED', false, data)
  }
  req.body.email = validator.normalizeEmail(req.body.email, { gmail_remove_dots: false });

  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      return JSONResponse(res, 'UNAUTHORIZED', false, { msg: info })
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
});

/**
 * GET /logout
 * Log out.
 */
router.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy((err) => {
    if (err) console.log('Error : Failed to destroy the session during logout.', err);
    req.user = null;
    res.redirect('/login?msg='+encodeURIComponent('Logged out successfully!'));
  });
});

/**
 * GET /signup
 * Signup page.
 */
router.get('/signup', (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, '../public/signup.html'));
});

/**
 * POST /signup
 * Create a new account.
 */
router.post('/signup', (req, res, next) => {
  const validationErrors = [];
  if (!(req.body.email && req.body.password && req.body.confirmPassword)) {
    validationErrors.push({ msg: "Some required fields are missing!"})
  }
  else {
    if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' });
    if (!validator.isLength(req.body.password, { min: 8 })) validationErrors.push({ msg: 'Password must be at least 8 characters long' });
    if (req.body.password !== req.body.confirmPassword) validationErrors.push({ msg: 'Passwords do not match' });  
  }
  if (validationErrors.length) {
    return JSONResponse(res, 'BAD_REQUEST', false, { errors: validationErrors })
  }
  req.body.email = validator.normalizeEmail(req.body.email, { gmail_remove_dots: false });

  const user = new User({
    email: req.body.email,
    password: req.body.password
  });

  User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (err) { return next(err); }
    if (existingUser) {
      return JSONResponse(res, 'BAD_REQUEST', false, { msg: 'Account with that email address already exists.' });
    }
    user.save((err) => {
      if (err) { return next(err); }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        let msg = 'Account created successfully!'
        res.redirect('/?msg='+encodeURIComponent(msg));
      });
    });
  });
});

/**
 * GET /account
 * Profile page.
 */
router.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/manage-account.html'))
});

/**
 * PUT /account/profile
 * Update profile information.
 */
router.put('/account', (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' });

  if (validationErrors.length) {
    return JSONResponse(res, 'BAD_REQUEST', false, { errors: validationErrors })
  }
  req.body.email = validator.normalizeEmail(req.body.email, { gmail_remove_dots: false });

  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    if (user.email !== req.body.email) user.emailVerified = false;
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    user.profile.website = req.body.website || '';
    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          msg='The email address you have entered is already associated with an account.';
          return 
        }
        return next(err);
      }
      return JSONResponse(res, 'SUCCESS', true, { msg: 'Profile updated successfully!'})
    });
  });
});

/**
 * PUT /account/password
 * Update current password.
 */
router.put('/account/password', (req, res, next) => {
  const validationErrors = [];
  if (!validator.isLength(req.body.password, { min: 8 })) validationErrors.push({ msg: 'Password must be at least 8 characters long' });
  if (req.body.password !== req.body.confirmPassword) validationErrors.push({ msg: 'Passwords do not match' });

  if (validationErrors.length) {
    return JSONResponse(res, 'BAD_REQUEST', false, { errors: validationErrors })
  }

  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user.password = req.body.password;
    user.save((err) => {
      if (err) { return next(err); }
      return JSONResponse(res, 'SUCCESS', true, { msg : 'Password has been changed.' });
    });
  });
});

/**
 * POST /account-delete
 * Delete user account.
 */
router.post('/account-delete', (req, res, next) => {
  User.deleteOne({ _id: req.user.id }, (err) => {
    if (err) { return next(err); }
    req.logout();
    res.redirect('/?msg='+encodeURIComponent('Your account has been deleted.'));
  });
});

module.exports = router;
