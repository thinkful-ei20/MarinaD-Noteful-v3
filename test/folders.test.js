'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const mocha = require('mocha');

const app = require('../server');
require('dotenv').config();
const {TEST_MONGODB_URI} = require('../config');

const folder = require('../models/folder');
const seedData = require('../db/seed/folders');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Folders API', function(){
  //Setup Database
  before(function(){
    return mongoose.connect(TEST_MONGODB_URI);
  });

  beforeEach(function(){
    return folder.insertMany(seedData)
      .then(()=> folder.createIndexes);
  });

  afterEach(function(){
    return mongoose.connection.db.dropDatabase();
  });    

  after(function(){
    return mongoose.disconnect();
  });

  describe('GET ALL /api/folders', function(){
    it('should return an array of objects when valid', function(){
      let res;

      return chai.request(app)
        .get('/api/folders')
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');

          return folder.find();
        })
        .then( data => {
          expect(data).to.be.an('array');
          res.body.forEach((folder , i) => {
            expect(folder._id).to.be.equal(data[i].id);
            expect(folder.name).to.be.equal(data[i].name);
            expect(new Date((folder.updatedAt)).getTime()).to.be.equal(new Date((data[i].updatedAt)).getTime());
            expect(new Date((folder.createdAt)).getTime()).to.be.equal(new Date((data[i].createdAt)).getTime());
          });
        });
    });

  });

  describe('GET BY ID /api/folders/:id', function(){

    it('should return a folder when valid id', function(){
      const id = '111111111111111111111100';
      let res;

      return chai.request(app)
        .get(`/api/folders/${id}`)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res).to.be.json;
          expect(res.body._id).to.be.equal('111111111111111111111100');

          return folder.findById(id);
        })
        .then(data => {
          expect(res.body._id).to.be.equal(data.id);
          expect(res.body.name).to.be.equal(data.name);
          expect(new Date((res.body.updatedAt)).getTime()).to.be.equal(new Date((data.updatedAt)).getTime());
          expect(new Date((res.body.createdAt)).getTime()).to.be.equal(new Date((data.createdAt)).getTime());
        });

    });

    it('should return an error when invalid id', function(){
      const invalidId = 'natall423';

      return chai.request(app)
        .get(`/api/folders/${invalidId}`)
        .then(res => {
          expect(res).to.have.status(400);
        });
    });

    it('should return a 404 when nonexistant valid id', function(){
      const nonexistantId = '111111111111111111111166';

      let res;
      return chai.request(app)
        .get(`/api/folders/${nonexistantId}`)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(404);

          return folder.findById(nonexistantId);
        })
        .then(data => {
          expect(data).to.be.equal(null);
        });
    });
  });

  describe('POST /api/folders', function(){
    it('should return a new folder given valid data', function(){
      const newFolder = {
        name : 'a new folder'
      };
      let res;

      return chai.request(app)
        .post('/api/folders')
        .send(newFolder)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res.header.location).to.exist;

          return folder.findById(res.body._id);
        })
        .then(data => {
          expect(res.body._id).to.be.equal(data.id);
          expect(res.body.name).to.be.equal(data.name);
          expect(new Date((res.body.updatedAt)).getTime()).to.be.equal(new Date((data.updatedAt)).getTime());
          expect(new Date((res.body.createdAt)).getTime()).to.be.equal(new Date((data.createdAt)).getTime());
        });
    });

    it('should return an error when given invalid data', function(){
      const invalidFolder = {};
      let res;

      return chai.request(app)
        .post('/api/folders')
        .send(invalidFolder)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(400);
          expect(res.body.message).to.be.equal('Missing `title` field in request');
        });
    });

  });

  describe('PUT /api/folders/:id', function(){
    it('should return an updated object with valid data', function(){
      const id = '111111111111111111111101';
      const updatedFolder = {
        name : 'an updated name'
      };

      let res;
      return chai.request(app)
        .put(`/api/folders/${id}`)
        .send(updatedFolder)
        .then(_res => {
          res = _res;
          
          expect(res).to.be.json;
          expect(res).to.have.status(200);
          expect(res.body.name).to.be.equal(updatedFolder.name);
          expect(res.body).to.have.keys(['_id','name','createdAt','updatedAt', '__v']);
          expect(res.body).to.be.an('object');

          return folder.findById(res.body._id);
        })
        .then(data => {
          expect(data.name).to.be.equal(updatedFolder.name);
          expect(data).to.be.an('object');

          expect(res.body._id).to.equal(data.id);
          expect(res.body.name).to.be.equal(data.name);
          expect(new Date((res.body.updatedAt)).getTime()).to.be.equal(new Date((data.updatedAt)).getTime());
          expect(new Date((res.body.createdAt)).getTime()).to.be.equal(new Date((data.createdAt)).getTime());
        });
    });

    it('should return an error with invalid data', function(){
      const id = '111111111111111111111101';
      const invalidFolder = {};

      return chai.request(app)
        .put(`/api/folders/${id}`)
        .send(invalidFolder)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.be.equal('Missing `title` field in request');
        });
    });

    it('should return an error if the ID is invalid', function(){
      const invalidId = 'sd32';
      const updatefolder = {
        name: 'a doomed name'
      };

      return chai.request(app)
        .put(`/api/folders/${invalidId}`)
        .send(updatefolder)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.be.equal('Bad request');
        });

    });

    it ('should return 404 if the ID does not exist', function(){
      const nonexistantId = '111111111111111111111166';
      const updateFolder = {
        name: 'another doomed folder'
      };

 
      return chai.request(app)
        .put(`/api/folders/${nonexistantId}`)
        .send(updateFolder)
        .then(res => {
          expect(res).to.have.status(404);
          expect(res.body.message).to.be.equal('Not Found');

          return folder.findById(nonexistantId);
        })
        .then(data => {
          expect(data).to.be.equal(null);
        });
    });
  });

  describe('DELETE /api/folders', function(){
    it('should delete the item given valid ID', function(){
      const id = '111111111111111111111101';

      return chai.request(app)
        .delete(`/api/folders/${id}`)
        .then(res => {
          expect(res).to.have.status(204);

          return folder.findById(id);
        })
        .then(data => {
          expect(data).to.be.equal(null);
        });
    });
  });

});