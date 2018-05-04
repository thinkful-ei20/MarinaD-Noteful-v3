'use strict';

const express = require('express');
const router = express.Router();

const Folder = require('../models/folder');
const mongoose = require('mongoose');

/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next)=> {
  Folder.find()
    .sort('name: 1')
    .then(results => {
      if(results.length) res.json(results);
      else next();
    })
    .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req,res,next)=>{
  const {id} = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)){
    const err = new Error('Bad request');
    err.status = 400;
    return next(err);
  }

  Folder.findById(id)
    .then(results => {
      if(results) res.json(results);
      else next();
    })
    .catch(err => next(err));
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req,res,next) => {
  const newFolder = {};

  const updateableFields = ['name'];

  if (!req.body.name) {
    const err = new Error('Missing `title` field in request');
    err.status = 400;
    return next(err);
  }

  updateableFields.map(field =>{
    if (field in req.body){
      newFolder[field] = req.body[field];
    }

    Folder.create(newFolder)
      .then(results => {
        if (results) res.status(201).location(`${req.hostname}${req.originalUrl}/${results._id}`).json(results);
        else next();
      })
      .catch(err => {
        if (err.code === 11000){
          const error = new Error('The folder name already exists');
          error.status = 400;
        }
        return next(err);
      });
  });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */

router.put('/:id', (req, res, next) => {
  const {id} = req.params;
  const updateFolder = {};
  const updateableFields = ['name'];

  if(!req.body.name){
    const err = new Error('Missing `title` field in request');
    err.status = 400;
    return next(err);
  }

  if(!mongoose.Types.ObjectId.isValid(id)){
    const err = new Error('Bad request');
    err.status = 400;
    return next(err);
  }

  updateableFields.map(field =>{
    if (field in req.body){
      updateFolder[field] = req.body[field];
    }});
  
  Folder.findByIdAndUpdate(id, updateFolder, {new : true})
    .then( result => {
      if(result) res.json(result);
      else next();
    })
    .catch(err => {
      if (err.code === 11000){
        const error = new Error('The folder name already exists');
        error.status = 400;
      }
      return next(err);
    });
  
});

/* ========== DELETE A SINGLE ITEM ========== */
router.delete('/:id', (req,res, next)=>{
  const {id} = req.params;

  Folder.findByIdAndRemove(id)
    .then(() => {
      res.sendStatus(204);
    });
});



module.exports = router;