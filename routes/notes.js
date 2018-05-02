'use strict';

const express = require('express');
const router = express.Router();

const Note = require('../models/note');

/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {

  const {searchTerm} = req.query;
  let filter ={};

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter = {$or : [{title : re}, {content : re}]};
  }

  return Note.find(filter)
    .sort('created')
    .then(results => {
      if(results) res.json(results);
      else next();
    })
    .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

  const {id} = req.params;

  if (id.length !== 24){
    const err = new Error ('Bad request');
    err.status = 400;
    next(err);
  }
  return Note.findById(id)
    .then((results)=> {
      if (results) {
        return res.json(results);
      }
      next();
    })
    .catch(err => { next(err);} );
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

  const newNote = {};
  const updateableFields = ['title','content'];

  if (!req.body.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    next(err);
  }

  updateableFields.forEach(field => {
    if (field in req.body) {
      newNote[field] = req.body[field];
    }
  });

  return Note.create(newNote)
    .then(result => res.location(`${req.hostname}${req.originalUrl}${result._id}`).status(201).json(result));

});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

  const {id} = req.params;
  
  if (id.length !== 24){
    const err = new Error ('Bad request');
    err.status = 400;
    next(err);
  }

  const updateNote = {
    updatedAt : Date.now()
  };

  const updateableFields = ['title', 'content'];
  updateableFields.forEach(field => {
    if (field in req.body){
      updateNote[field] = req.body[field];
    }
  });
  
  return Note.findByIdAndUpdate(id, updateNote, {upsert: true, new : true})
    .then(result => res.json(result))
    .catch(err => next(err));

});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

  const {id} = req.params;

  if (id.length !== 24){
    const err = new Error ('Bad request');
    err.status = 400;
    next(err);
  }

  return Note.findByIdAndRemove(id)
    .then(() => res.status(204).end())
    .catch(err => next(err));
});

module.exports = router;