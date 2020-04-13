const express = require('express');

const router = express.Router();
// eslint-disable-next-line
const passport = require('../config/passport')(require('passport'));
const { asyncHandler } = require('../helpers');
const Page = require('../models/Page');

/* GET home page. */
router.get('/', [passport.isAuthenticated], asyncHandler(async (req, res, next) => {
  const pages = await Page.find({ $or: [{ sharedWith: req.user._id }, { creator: req.user._id }] })
    .populate('sharedWith').populate('creator').exec();
  res.render('home', {
    title: 'Your Pages',
    pages
  });
}));

module.exports = router;
