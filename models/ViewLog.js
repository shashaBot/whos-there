const mongoose = require('mongoose');

const viewLogSchema = new mongoose.Schema({
  viewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  page: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page'
  }
})

const ViewLog = mongoose.model('ViewLog', viewLogSchema);

module.exports = ViewLog;
