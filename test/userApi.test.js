const User = require('../models/user')
const RefreshToken = require('../models/refreshtoken')
const chai = require('chai')
const chaiHttp = require('chai-http')
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

// Import the application to test
const app = require('../index')
// Configure Chai
chai.should()
chai.use(chaiHttp)

//https://stackoverflow.com/questions/44149096/for-async-tests-and-hooks-ensure-done-is-called-if-returning-a-promise-en

describe('User crud unit test', () => {
  let refreshtoken
  let accessToken
  let userstore

  User.collection.drop()
  RefreshToken.collection.drop()

  before(async () => {
    const hashedPassword = await bcrypt.hash('test1233', 10)

    mockUser = new User({
      name: 'test 1233',
      email: 'test1233@test.com',
      password: hashedPassword,
    })

    await mockUser.save()
  })

  describe('/api/users/login', () => {
    it('should login success', async () => {
      let user = {
        email: 'test1233@test.com',
        password: 'test1233',
      }

      const res = await chai
        .request(app)
        .post('/api/users/login')
        .set('Content-Type', 'application/json')
        .send(user)

      res.should.have.status(201)
      res.should.be.json
      refreshtoken = res.body.newToken.refresh_token
      accessToken = res.body.accessToken
      userstore = res.body.user
    })
  })

  describe('/api/users', () => {
    it('should get user success', () => {
      chai
        .request(app)
        .get('/api/users')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .then((res) => {
          res.should.have.status(200)
          res.should.be.json
          res.body.user.email.equal(userstore.email)
        })
    })
  })

  /*  
  describe('/api/users/update-profile', () => {
    it('should update user success', () => {
      let user = {
        "_id": userstore._id,
        "name": "test from mocha123",
        "email": "test123@test.com",
        "password": "test123"
      };
      chai.request(app)
          .put('/api/users/update-profile')
          .set('Content-Type', 'application/json')
          .set("Authorization", 'Bearer ' + accessToken )
          .set('Cookie', `token=${ refreshtoken };retoken=${ accessToken }`)
          .send(user)
          .then(res => {
                res.should.have.status(200);
          })
    
        });
    });
   */
  describe('/api/users/logout', () => {
    it('should logout success', async () => {
      chai
        .request(app)
        .delete('/api/users/logout')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .then((res) => {
          res.should.have.status(204)
        })
    })
  })

  describe('/api/users/signup', () => {
    it('should signup success', async () => {
      let user = {
        name: 'test from mocha',
        email: 'test12@test.com',
        password: 'test12',
      }

      const res = await chai
        .request(app)
        .post('/api/users/signup')
        .set('Content-Type', 'application/json')
        .send(user)

      res.should.have.status(201)
      res.should.be.json
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})
