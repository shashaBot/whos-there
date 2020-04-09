const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  name: String,
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastViewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastViewerdAt: Date
}, 
{
  timestamps: true
});

const Page = mongoose.model('Page', pageSchema);

module.exports = Page;
