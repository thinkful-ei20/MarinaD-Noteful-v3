'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {MONGODB_URI} =require('../config');

const Note = require('../models/note');
// connect to database and then disconnect

//GET ALL / by Search Term
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const searchTerm = null;
//     let filter= {};

//     if (searchTerm) {
//       const re = new RegExp(searchTerm, 'i');
//       filter.title = {$regex: re};
//     }

//     return Note.find(filter)
//       .sort('created')
//       .then(results => console.log(results));
//   })
//   .then(()=> {mongoose.disconnect();})
//   .catch( err => {
//     console.error(`ERROR: ${err.message}`);
//     console.log(err);
//   });

//GET by id

mongoose.connect(MONGODB_URI)
  .then(() => {
    const id = '5ae8c3925e4f83467c2f9ed5';
    console.log('file ran');
    return Note.update({}, 
      {$pull : {tags : '222222222222222222222200'}},
      {multi : true});
  })
  .then(()=> {mongoose.disconnect();})
  .catch( err => {
    console.error(`ERROR: ${err.message}`);
    console.log(err);
  });

