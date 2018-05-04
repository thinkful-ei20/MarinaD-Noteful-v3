'use strict';

const mongoose = require('mongoose');

const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../server');
require('dotenv').config();
const {TEST_MONGODB_URI} = require('../config');

const Tag = require('../models/tag');
const seedData = require('../db/seed/tags');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Tags API', function(){

  before(function(){
    return mongoose.connect(TEST_MONGODB_URI);
  });

  beforeEach(function(){
    return Tag.insertMany(seedData)
      .then(()=>{Tag.createIndexes();});
  });

  afterEach(function(){
    return mongoose.connection.db.dropDatabase();
  });

  after(function(){
    return mongoose.disconnect();
  });

  describe('GET /api/tags/', function(){

    it('should get all tags ', function(){
      let res;
      return chai.request(app)
        .get('/api/tags')
        .then(_res =>{
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          return Tag.find().sort({name:1});
        }).then((data)=>{
          expect(res.body.length).to.be.equal(data.length);
          for (let i = 0; i <data.length; i ++){
            expect(res.body[i]._id).to.be.equal(data[i].id);
            expect(res.body[i].name).to.be.equal(data[i].name);
            expect(new Date(res.body[i].createdAt).getTime()).to.be.equal(new Date(data[i].createdAt).getTime());
            expect(new Date(res.body[i].updatedAt).getTime()).to.be.equal(new Date(data[i].updatedAt).getTime());
          }
        });    
    });
  });

  describe('GET BY ID /api/tags/:id', function(){
    it('should return correct note with valid ID', function(){
      const id = '222222222222222222222200';
      let res;
      return chai.request(app)
        .get(`/api/tags/${id}`)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');

          return Tag.findById(id);
        })
        .then(data => {
          expect(res.body._id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt).getTime()).to.be.equal(new Date(data.createdAt).getTime());
          expect(new Date(res.body.updatedAt).getTime()).to.be.equal(new Date(data.updatedAt).getTime());
        });
    });

    it('should return error with invalid ID', function(){
      const id = 'djks2';

      chai.request(app)
        .get(`/api/tags/${id}`)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.be.equal('Bad Request');
        });
    });

    it('should return 404 with nonexistant ID', function(){
      const id = '222222222222222222222208';
      let res;
      return chai.request(app)
        .get(`/api/tags/${id}`)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(404);
          expect(res.body.message).to.be.equal('Not Found');

          return Tag.findById(id);
        })
        .then(data => {
          expect(data).to.be.equal(null);
        });      
    });
  });

  describe('POST /api/tags', function(){
    it('should return a new object when given valid data', function(){
      const newTag = {
        name: 'testTag'
      };
      let res;
      chai.request(app)
        .post('/api/tags')
        .send(newTag)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res.header.location).to.exist;
          return Tag.findById(res.body._id);
        })
        .then(data => {
          expect(res.body._id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt).getTime()).to.be.equal(new Date(data.createdAt).getTime());
          expect(new Date(res.body.updatedAt).getTime()).to.be.equal(new Date(data.updatedAt).getTime());
        });
    });

    it('should return an error when missing name', function(){
      const newTag = {};

      chai.request(app)
        .post('/api/tags')
        .send(newTag)
        .then(res=> {
          expect(res).to.have.status(400);
          expect(res.body.message).to.be.equal('Missing `name` in request');
        });
    });
  });

  describe('PUT api/tags/:id', function(){
    it('should return the updated object given valid data',function(){
      const id = '222222222222222222222200';
      const updateTag = {
        name: 'updatedTagName'
      };
      let res;
      return chai.request(app)
        .put(`/api/tags/${id}`)
        .send(updateTag)
        .then(_res=> {
          res = _res;
          expect(res).to.have.status(200);

          return Tag.findById(id);
        })
        .then(data => {
          expect(res.body._id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt).getTime()).to.be.equal(new Date(data.createdAt).getTime());
          expect(new Date(res.body.updatedAt).getTime()).to.be.equal(new Date(data.updatedAt).getTime());
        });
    });

    it('should return an error when missing name',function(){
      const id = '222222222222222222222200';
      const updateTag = {};

      return chai.request(app)
        .put(`/api/tags/${id}`)
        .send(updateTag)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.be.equal('Missing `name` in request');
        });

    });

    it('should return an error with invalid ID',function(){
      const id = 'hufflpuff';
      const updateTag = {
        name: 'doomedUpdatedTitle'
      };

      return chai.request(app)
        .put(`/api/tags/${id}`)
        .send(updateTag)
        .then(res=> {
          expect(res).to.have.status(400);
          expect(res.body.message).to.be.equal('Bad Request');
        });
    });

    it('should return 404 with nonexsitant ID',function(){
      const id = '222222222222222222222208';
      const updateTag = {
        name: 'doomedTag'
      };

      return chai.request(app)
        .put(`/api/tags/${id}`)
        .send(updateTag)
        .then(res => {
          expect(res).to.have.status(404);
          expect(res.body.message).to.be.equal('Not Found');

          return Tag.findById(id);
        })
        .then(data => {
          expect(data).to.be.equal(null);
        });

    });

  });

  describe('DELETE /api/tags/:id', function(){
    it('should delete a tag given valid id', function(){
      const id = '222222222222222222222200';

      return chai.request(app)
        .del(`/api/tags/${id}`)
        .then(res => {
          expect(res).to.have.status(204);

          return Tag.findById(id);
        })
        .then(data => {
          expect(data).to.be.equal(null);
        });
    });

    it('should return an error given an invalid id', function(){
      const id = 'notvalid';

      return chai.request(app)
        .del(`/api/tags/${id}`)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.be.equal('Bad Request');
        });
    });
  });
});

