const supertest = require('supertest');
const server = require('../app.js');
const dotenv = require('dotenv')
dotenv.config();
const requestWithSupertest = supertest(server);

const {MongoClient} = require('mongodb');

describe('MongoDB insertion test', () => {
  let connection;
  let db;

  beforeAll(async () => {
    connection = await MongoClient.connect(process.env.DB_CONNECT, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = await connection.db('permission-manager');
  });

  afterAll(async () => {
    await connection.close();
  });

  it('should insert a doc into collection', async () => {
    const users = db.collection('test');

    const mockUser = {_id: 'some-user-id', name: 'John'};
    await users.insertOne(mockUser);

    const insertedUser = await users.findOne({_id: 'some-user-id'});
    expect(insertedUser).toEqual(mockUser);
  });
});

describe('Basic Endpoints', ()=> {
  it('GET /', async () => {
    const res = await requestWithSupertest.get('/');
    expect(res.status).toEqual(200);
  });
});

describe('Basic Google Endpoints', () => {
  it('GET /google/adduserfiles test', async () => {
    const res = await requestWithSupertest.get('/google/addperm');
    expect(res.status).toEqual(200);
  });

  it('GET /google/addaccess test', async () => {
    const res = await requestWithSupertest.get('/google/addaccess');
    expect(res.status).toEqual(200);
  });

  it('GET /google/f/updateperm test', async () => {
    const res = await requestWithSupertest.get('/google/f/updateperm');
    expect(res.status).toEqual(200);
  });

  it('GET /google/signout', async () => {
    const res = await requestWithSupertest.get('/google/signout');
    expect(res.text).toEqual('Found. Redirecting to /');
    expect(res.status).toEqual(302);
  });
});

describe('Basic Microsoft Endpoints', ()=> {
  it('GET /users/microsoftupdateperm test', async () => {
    const res = await requestWithSupertest.get('/users/microsoftupdateperm');
    expect(res.status).toEqual(200);
  });

  it('GET /users/microsoft/addperm test', async () => {
    const res = await requestWithSupertest.get('/users/microsoft/addperm');
    expect(res.status).toEqual(200);
  });

  it('GET /users/microsoft/addaccess test', async () => {
    const res = await requestWithSupertest.get('/users/microsoft/addaccess');
    expect(res.status).toEqual(200);
  });

  
});