'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Note = require('../models/note');

/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {

  const {searchTerm} = req.query;
  let filter= {};

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.title = {$regex: re};
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

  updateableFields.forEach(field => {
    if (field in req.body) {
      newNote[field] = req.body[field];
    }
  });

  return Note.create(newNote)
    .then(result => res.json(result));
  // res.location('path/to/new/document').status(201).json({ id: 2, title: 'Temp 2' });

});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

  console.log('Update a Note');
  res.json({ id: 1, title: 'Updated Temp 1' });

});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

  console.log('Delete a Note');
  res.status(204).end();
});

module.exports = router;