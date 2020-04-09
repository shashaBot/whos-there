const express = require('express');
const router = express.Router();

const passport = require('../config/passport')(require('passport'));
const Page = require('../models/Page');
const asyncHandler = require('../helpers');
const { JSONResponse } = require('../helpers');

/**
 * Middleware - isSharedWith
 * Only allow if the current user has been shared access to the page
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 * @param {Express.next} next 
 */
function isSharedWith (req, res, next) {
  page = await Page.findOne({_id: req.params.PageId, isSharedWith: {$contains: req.user._id}}).exec()
  if (!page) {
    return res.redirect('/unauthorized.html?msg='+encodeURIComponent('You do not access to the have to the page you are trying to view.'));
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
function isCreator (req, res, next) {
  page = await Page.findOne({ _id: req.params.id, creator: req.user._id }).exec();
  if (!page) {
    return res.redirect('/unauthorized.html?msg='+encodeURIComponent('The page you are trying to view either does not exist or you do not have access to it.'));
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
function markViewed (req, res, next) {
  req.page.lastViewedAt = Date.now();
  req.page.lastViewedBy = req.user._id;
  await req.page.save();
  return next();
}

/**
 * GET all pages (that current user can see)
 */
router.get('/', passport.isAuthenticated, asyncHandler(async (req, res, next) => {
  pages = await Page.find({ sharedWith: { $contains: req.user._id } }).exec();
  return JSONResponse(res, 'SUCCESS', true, { pages })
}));

/**
 * GET a specific Page with id "pageId"
 */
router.get('/:pageId', [passport.isAuthenticated, asyncHandler(isSharedWith), asyncHandler(markViewed)], asyncHandler( async (req, res, next) => {
  return JSONResponse(res, 'SUCCESS', true, { page: req.page });
}));

/**
 * POST Create a page
 */
router.post('/', passport.isAuthenticated, asyncHandler( async (req, res, next) => {
  page = new Page({
    name: req.body.name,
    creator: req.user._id,
    lastViewedBy: req.user._id,
    lastViewedAt: Date.now()
  })
  await page.save()
  return res.redirect('/?msg='+encodeURIComponent('Page created successfully!'));
}));

/**
 * PATCH Modify page sharing
 */
router.patch('/:pageId', [passport.isAuthenticated, asyncHandler(isCreator)], (req, res, next) => {
  req.page.sharedWith = req.body.sharedWith;
  await req.page.save();
  return JSONResponse(res, 'SUCCESS', true, { msg: 'Sharing settings updated.'})
});
