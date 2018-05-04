'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Tag = require('../models/tag');
const Notes = require('../models/note');

const router = express.Router();

// == GET ALL == //
router.get('/',function(req,res,next){
  Tag.find()
    .sort({name:1})
    .then(result => {
      res.json(result);
    })
    .catch(err => next(err));

});

// == GET By ID == //
router.get('/:id',function(req,res,next){
  const {id} = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)){
    const err = new Error('Bad Request');
    err.status = 400;
    return next(err);
  }
  Tag.findById(id)
    .then(result=>{
      if(result) res.json(result);
      else return next();
    })
    .catch(err => next(err));
});

// == POST == //
router.post('/',function(req, res, next){
  const newTag= {
    name: req.body.name
  };

  if(!newTag.name){
    const err = new Error('Missing `name` in request');
    err.status = 400;
    return next(err);
  }

  Tag.create(newTag)
    .then(result => {
      if(result) res.status(201).location(`${req.hostname}${req.originalUrl}/${result._id}`).json(result);
      else return next();
    })
    .catch(err => {
      if (err.code === 11000){
        const error = new Error('Woops, that tag already exists! Reload the page?');
        return next(error);
      }
    });
});

// == PUT BY ID == //
router.put('/:id',function(req,res,next){
  
  const {id} = req.params;
  
  const updatedTag= {
    name: req.body.name
  };

  if(!updatedTag.name){
    const err = new Error('Missing `name` in request');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)){
    const err = new Error('Bad Request');
    err.status = 400;
    return next(err);
  }

  Tag.findByIdAndUpdate(id, updatedTag, {new: true})
    .then(result=>{
      if(result) res.json(result);
      else {
        const err = new Error('Not Found');
        err.status = 404;
        return next(err);}
    })
    .catch(err => {
      if (err.code === 11000){
        const error = new Error('Woops, that tag already exists! Reload the page?');
        return next(error);
      }
    });
});

// == DELETE BY ID == //
router.delete('/:id',function(req,res,next){
  const {id} = req.params;
  
  if(!mongoose.Types.ObjectId.isValid(id)){
    const err = new Error('Bad Request');
    err.status = 400;
    return next(err);
  }

  Tag.findByIdAndRemove(id)
    .then(() => {
      return Notes.update({}, 
        {$pull : {tags : id}},
        {multi : true});
    })
    .then(()=> {
      res.sendStatus(204);
    })
    .catch(err => next(err));
  
});

module.exports = router;