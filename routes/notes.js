'use strict';

const express = require('express');
const router = express.Router();

const Note = require('../models/note');
const mongoose = require('mongoose');

/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {

  const {searchTerm, folderId} = req.query;
  let filter ={};

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter = {$or : [{title : re}, {content : re}]};
  }
  if (folderId){
    filter.folderId = folderId;
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
    return next(err);
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
  const updateableFields = ['title','content','folderId'];

  if(!mongoose.Types.ObjectId.isValid(req.body.folderId)){
    const error = new Error('Bad request');
    error.status = 400;
    return next(error);
  }

  if (!req.body.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
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
  const{folderId} = req.body;
  const updateNote = {};

  if(!mongoose.Types.ObjectId.isValid(id)){
    const error = new Error('Bad request');
    error.status = 400;
    return next(error);
  }
  
  const updateableFields = ['title', 'content', 'folderId'];
  updateableFields.forEach(field => {
    if (field in req.body){
      updateNote[field] = req.body[field];
    }
  });
  
  return Note.findByIdAndUpdate(id, updateNote, {new : true})
    .then(result => {
      res.json(result);})
    .catch(err => next(err));

});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

  const {id} = req.params;

  if (id.length !== 24){
    const err = new Error ('Bad request');
    err.status = 400;
    return next(err);
  }

  return Note.findByIdAndRemove(id)
    .then(() => res.status(204).end())
    .catch(err => next(err));
});

module.exports = router;