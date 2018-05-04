'use strict';

const mongoose = require('mongoose');

const folderSchema = mongoose.Schema({
  name : {type: String, unique: true }
},
{timestamps :  true});

const Folders = mongoose.model('Folder', folderSchema);

module.exports = Folders;