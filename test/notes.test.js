'use strict';

//Imports
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
require('dotenv').config();
const {TEST_MONGODB_URI} = require('../config');

const note = require('../models/note');
const folder = require('../models/folder');
const seedNoteData = require('../db/seed/notes');
const seedFolderData = require('../db/seed/folders');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Notes API', function (){
  before(function (){
    return mongoose.connect(TEST_MONGODB_URI)
      .then(()=> mongoose.connection.db.dropDatabase());
  });
  beforeEach(function(){
    return note.insertMany(seedNoteData)
      .then(folder.insertMany(seedFolderData)) 
      .then(()=> note.createIndexes())
      .then(() => folder.createIndexes())
      .catch(err => console.error(err));
  });
  afterEach(function(){
    return mongoose.connection.db.dropDatabase();
  });
  after(function(){
    return mongoose.disconnect();
  });
  
  describe('GET api/notes/', function(){
    it('should return all notes',function(){
      let res;
      return chai.request(app)
        .get('/api/notes')
        .then(_res => {
          res = _res;
          expect(res.status).to.equal(200);
          expect(res.body).to.be.an('array');
          expect (res).to.be.json;
          expect(res.body[0]).to.have.keys(['tags','title','content','folderId','id','createdAt','updatedAt']);
          
          return note.find();
        })
        .then(data => {
          expect(res.body.length).to.equal(data.length);
        });
    });
  });

  describe('GET api/notes/:id', function(){
    it('should return the correct note', function(){
      const id = '000000000000000000000002';
      let res;
      //Call API
      return chai.request(app)
        .get(`/api/notes/${id}`)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content',
            'createdAt', 'updatedAt', 'folderId','tags');
          expect(res.body.tags).to.be.an('array');
          //Call database

          return note.findById(id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(res.body.folderId).to.equal(data.folderId.toString());        });
    });

    it('should return empty request if given a nonexistant Id', function(){
      const notAnId = '000000000000000000000042';
      let res;

      return chai.request(app)
        .get(`/api/notes/${notAnId}`)
        .then (_res => {
          res = _res;
          expect(res).to.have.status(404);
          expect(res).to.be.json;
          expect(res.body).to.have.keys(['error', 'message']);

          return note.findById(notAnId);
        })
        .then(data => {
          expect(data).not.to.exist;
        });
    });

    it ('should return 400 error when given an invalid id', function(){
      const invalidId = 'notanid';

      return chai.request(app)
        .get(`/api/notes/${invalidId}`)
        .then(res => {

          expect(res).to.have.status(400);
          expect(res.body).to.have.keys(['message','error']);
        });

    });
  });

  describe('POST /api/notes', function(){
    it('should create and return a new item with valid data', 
      function() {
        const newItem = {
          'title' : 'The best article evar',
          'content': 'some stuff',
          'folderId' : '111111111111111111111102',
          'tags' : ['222222222222222222222201']
        };

        let res;
        //Call API
        return chai.request(app)
          .post('/api/notes')
          .send(newItem)
          .then(function (_res){
            res = _res;
            expect(res).to.have.status(201);
            expect(res).to.have.header('location');
            expect(res).to.be.json;
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.keys('tags','folderId', 'id','title','content','createdAt','updatedAt');
            expect(res.body.tags).to.be.an('array');
            //Call the Database
            return note.findById(res.body.id);
          })
          //Compare data
          .then(data => {
            const stringFolderId = data.folderId.toString();
            expect(res.body.title).to.equal(data.title);
            expect(res.body.content).to.equal(data.content);
            expect(res.body.folderId).to.equal(stringFolderId);
            expect(res.body.tags.length).to.equal(data.tags.length);
          });

      });

    it('should return an error when not given a title', function(){
      const invalidObj = {
        'content': 'stuff'
      };

      let res;

      return chai.request(app)
        .post('/api/notes')
        .send(invalidObj)
        .then (_res => {
          res = _res;

          expect(res).to.have.status(400);
          expect(res.body).to.have.keys(['message','error']);
        });
    });
  });

  describe('PUT /api/notes/:id', function() {

    it('should update the correct note when given valid input', function(){
      const updateObj = {
        'title' : 'an updated note',
        'content' : 'some new content',
        'folderId' : '111111111111111111111101',
        'tags' : ['222222222222222222222203']
      };
      const validExistingId = '000000000000000000000002';
      let res;

      return chai.request(app)
        .put(`/api/notes/${validExistingId}`)
        .send(updateObj)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys(['tags','folderId', 'id', 'title', 'content', 'updatedAt', 'createdAt']);
          expect(res.body.title).to.be.equal('an updated note');

          return note.findById(res.body.id);
        })
        .then(data => {
          const stringFolderId = data.folderId.toString();
          expect(res.body.id).to.be.equal(data.id);
          expect(res.body.title).to.be.equal(data.title);
          expect(res.body.content).to.be.equal(data.content);
          expect(res.body.folderId).to.be.equal(stringFolderId);
          expect(res.body.tags.length).to.equal(data.tags.length);
        });
    });

    it('should give an error when given invalid id', function(){
      const invalidId = 'notanid';
      const updateObj = {
        'title' : 'hope this doesn\'t work'
      };

      return chai.request(app)
        .put(`/api/notes/${invalidId}`)
        .send(updateObj)
        .then(res => {

          expect(res).to.have.status(400);
          expect(res.body).to.have.keys(['message','error']);
        });
    });
  });

  describe('DELTE /api/notes/:id', function(){

    it('should delete a note when given a valid id', function(){
      const id = '000000000000000000000003';

      return chai.request(app)
        .delete(`/api/notes/${id}`)
        .then(res => {
          
          expect(res).to.have.status(204);

          return note.findByIdAndRemove(id);
        })
        .then(data => {
          expect(data).not.to.exist;
        });
    });

    it('should return an error when given an invalid id', function(){
      const invalidId = 'notanid';

      return chai.request(app)
        .delete(`/api/notes/${invalidId}`)
        .then(res => {

          expect(res).to.have.status(400);
          expect(res.body).to.have.keys(['message','error']);
        });
    });
  });
});