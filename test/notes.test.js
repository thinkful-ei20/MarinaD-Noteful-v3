'use strict';

//Imports
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const {TEST_MONGODB_URI} = require('../config');

const note = require('../models/note');
const seedData = require('../db/seed/notes');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Notes API', function (){
  before(function (){
    return mongoose.connect(TEST_MONGODB_URI)
      .then(()=> mongoose.connection.db.dropDatabase());
  });
  beforeEach(function(){
    return mongoose.connection.db.dropDatabase()
      .then(()=> note.insertMany(seedData))
      .then(()=> note.createIndexes());
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
          
          return note.find();
        })
        .then(data => {
          expect(res.body.length).to.equal(data.length);
        });
    });
  });

  describe.only('GET api/notes/:id', function(){
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
            'createdAt', 'updatedAt');
          //Call database
          return note.findById(id);
        })
        .then(data => {
          //Compare
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
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
        .get('/api/notes/${invalidId}')
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
          'content': 'some stuff'
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
            expect(res.body).to.have.keys('id','title','content','createdAt','updatedAt');
            //Call the Database
            return note.findById(res.body.id);
          })
          //Compare data
          .then(data => {
            expect(res.body.title).to.equal(data.title);
            expect(res.body.content).to.equal(data.content);
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
});
