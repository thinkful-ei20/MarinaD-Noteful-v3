'use strict';

const express = require('express');
const router = express.Router();

const Note = require('../models/note');
const mongoose = require('mongoose');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {

  const {searchTerm, folderId, tagId} = req.query;
  let filter ={};

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter = {$or : [{title : re}, {content : re}]};
  }
  if (folderId){
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  return Note.find(filter)
    .populate('tags')
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
        results.populate('tags');
        return res.json(results);
      }
      next();
    })
    .catch(err => { next(err);} );
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

  const newNote = {
    title: '',
    content: '',
    folderId: '',
    tags: []
  };
  const updateableFields = ['title','content','folderId','tags'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      newNote[field] = req.body[field];
    }
  });

  if(newNote.folderId.length && !mongoose.Types.ObjectId.isValid(req.body.folderId)){
    const error = new Error('Bad request');
    error.status = 400;
    return next(error);
  }

  newNote.tags.map(tag => {
    if (tag && !mongoose.Types.ObjectId.isValid(tag)){
      console.log(tag);
      const error = new Error('Bad request');
      error.status = 400;
      return next(error);
    }
  });

  if (!req.body.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }



  return Note.create(newNote)
    .then(result => res.location(`${req.hostname}${req.originalUrl}${result._id}`).status(201).json(result));

});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

  const {id} = req.params;
  const{folderId} = req.body;
  const {tags} = req.body;
  const updateNote = {};

  const updateableFields = ['title', 'content', 'folderId','tags'];
  updateableFields.forEach(field => {
    if (field in req.body){
      updateNote[field] = req.body[field];
    }
  });

  if(!mongoose.Types.ObjectId.isValid(id)||(
  folderId && !mongoose.Types.ObjectId.isValid(folderId))){
    const error = new Error('Bad request');
    error.status = 400;
    return next(error);
  }

  if (tags){
    tags.map(tag => {
      if (!mongoose.Types.ObjectId.isValid(tag)){
        const error = new Error('Bad request');
        error.status = 400;
        return next(error);
      }
    });
  }
  
  
  
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