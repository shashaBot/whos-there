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
  }]
}, 
{
  timestamps: true
});

const Page = mongoose.model('Page', pageSchema);

module.exports = Page;
