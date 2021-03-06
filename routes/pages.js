const express = require('express');

const router = express.Router();
const { ObjectId } = require('mongoose').Types;

const Page = require('../models/Page');
const ViewLog = require('../models/ViewLog');
const { asyncHandler } = require('../helpers');
const User = require('../models/User');

// eslint-disable-next-line
const passport = require('../config/passport')(require('passport'));

/**
 * Middleware - isSharedWith
 * Only allow if the current user has been shared access to the page
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Express.next} next
 */
async function isSharedWith(req, res, next) {
  // Allow user to view page if they are the creator or the page is shared with them
  let { pageId } = req.params;
  try {
    pageId = ObjectId(pageId);
  } catch (e) {
    req.flash('errors', { msg: 'The page you\'re looking for doesn\'t exist.' });
    return res.redirect('/404');
  }
  const page = await Page.findOne({
    $and: [
      { _id: pageId },
      {
        $or: [
          { sharedWith: req.user._id },
          { creator: req.user._id }]
      }
    ]
  }).exec();
  if (!page) {
    req.flash('errors', { msg: 'The page either doesn\'t exist or you don\'t have access to it.' });
    return res.redirect('/404');
  }
  req.page = page;
  return next();
}


/**
 * Middleware - isCreator
 * Only allow if the current user is the creator of the page
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Express.next} next
 */
async function isCreator(req, res, next) {
  let { pageId } = req.params;
  try {
    pageId = ObjectId(pageId);
  } catch (e) {
    req.flash('errors', { msg: 'The page you\'re looking for doesn\'t exist.' });
    return res.redirect('/404');
  }
  const page = await Page.findOne({
    _id: pageId,
    creator: ObjectId(req.user.id)
  })
    .exec();
  if (!page) {
    req.flash('errors', { msg: 'The page either doesn\'t exist or you don\'t have access to it.' });
    res.redirect('/404');
  }
  req.page = page;
  return next();
}

/**
 * Middleware - markViewed
 * Update lastViewedAt and lastViewedBy for the page
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Express.next} next
 */
async function markViewed(req, res, next) {
  let log = await ViewLog.findOne({ page: req.page.id, viewer: ObjectId(req.user.id) }).exec();
  if (log) {
    log.viewedAt = new Date();
  } else {
    log = new ViewLog({
      viewer: req.user.id,
      page: req.page._id
    });
  }
  await log.save();
  return next();
}

/**
 * GET Create page form
 */
router.get('/new', passport.isAuthenticated, asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).exec();
  res.render('create', {
    title: 'Create New Page',
    users
  });
}));

/**
 * GET a specific Page with id "pageId"
 */
router.get('/:pageId', [passport.isAuthenticated, asyncHandler(isSharedWith), asyncHandler(markViewed)], asyncHandler(async (req, res, next) => {
  const viewLogs = await ViewLog.find({ page: req.page.id })
    .populate('viewer').exec();
  res.render('page', {
    title: req.page.name,
    page: req.page,
    viewLogs
  });
}));

/**
 * POST Create a page
 */
router.post('/', passport.isAuthenticated, asyncHandler(async (req, res, next) => {
  const page = new Page({
    name: req.body.name,
    creator: req.user.id,
    sharedWith: (req.body.sharedWith || [])
  });
  await page.save();
  req.flash('success', { msg: 'Page created successfully!' });
  return res.redirect(`/pages/${page.id}`);
}));

/**
 * GET Edit Page
 */
router.get('/edit/:pageId', [passport.isAuthenticated, asyncHandler(isCreator)], asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).exec();
  res.render('create', {
    title: req.page.name,
    page: req.page,
    users,
    editing: true
  });
}));

/**
 * POST Modify page
 */
router.post('/:pageId', [passport.isAuthenticated, asyncHandler(isCreator)], asyncHandler(async (req, res, next) => {
  if (req.body.sharedWith) req.page.sharedWith = req.body.sharedWith;
  if (req.body.name) req.page.name = req.body.name;
  await req.page.save();
  req.flash('success', { msg: 'Page updated successfully!' });
  res.redirect(`/pages/${req.params.pageId}`);
}));

module.exports = router;
