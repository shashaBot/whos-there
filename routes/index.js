const express = require('express');

const router = express.Router();
const passport = require('../config/passport')(require('passport'));
const { asyncHandler } = require('../helpers');
const Page = require('../models/Page');

/* GET home page. */
router.get('/', [passport.isAuthenticated], asyncHandler(async (req, res, next) => {
  const pages = await Page.find({ sharedWith: req.user.id });
  res.render('home', {
    title: 'Your Pages',
    pages
  });
}));

module.exports = router;
