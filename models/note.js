'use strict';

const mongoose = require('mongoose');

const noteSchema = mongoose.Schema({
  title: {
    type: String,
    required : true
  },
  content : String,
  createdAt : {
    type: Date,
    default: Date.now
  },
  updatedAt : {
    type: Date,
    default: Date.now
  }
});

const Notes = mongoose.model('Note', noteSchema);
module.exports = Notes;