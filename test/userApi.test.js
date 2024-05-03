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
    it('fails with statuscode 404 email is invalid', async () => {
      let user = {
        email: 'test12@test.com',
        password: 'test12',
      }

      const res = await chai
        .request(app)
        .post('/api/users/login')
        .set('Content-Type', 'application/json')
        .send(user)

      res.should.have.status(404)
      res.should.be.json
      res.body.message.should.equal('cannot find user, please sign up')
    })

    it('fails with statuscode 400 password is invalid', async () => {
      let user = {
        email: 'test1233@test.com',
        password: 'test1234',
      }

      const res = await chai
        .request(app)
        .post('/api/users/login')
        .set('Content-Type', 'application/json')
        .send(user)

      res.should.have.status(400)
      res.should.be.json
      res.body.message.should.equal('Invalid password')
    })

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

    it('fails with statuscode 400 when user is logged in', async () => {
      let user = {
        email: 'test1233@test.com',
        password: 'test1233',
      }

      const res = await chai
        .request(app)
        .post('/api/users/login')
        .set('Content-Type', 'application/json')
        .send(user)

      res.should.have.status(400)
      res.should.be.json
      res.body.message.should.equal('user is login!')
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

    it('fails with statuscode 400 password character less than 6', async () => {
      let user = {
        name: 'test from mocha',
        email: 'test12@test.com',
        password: 'test1',
      }

      const res = await chai
        .request(app)
        .post('/api/users/signup')
        .set('Content-Type', 'application/json')
        .send(user)

      res.should.have.status(400)
      res.should.be.json
    })

    it('fails with statuscode 400 name is not input', async () => {
      let user = {
        name: '',
        email: 'test12@test.com',
        password: 'test1',
      }

      const res = await chai
        .request(app)
        .post('/api/users/signup')
        .set('Content-Type', 'application/json')
        .send(user)

      res.should.have.status(400)
      res.should.be.json
    })

    it('fails with statuscode 400 email is not input', async () => {
      let user = {
        name: '1111',
        email: '',
        password: 'test1',
      }

      const res = await chai
        .request(app)
        .post('/api/users/signup')
        .set('Content-Type', 'application/json')
        .send(user)

      res.should.have.status(400)
      res.should.be.json
    })

    it('fails with statuscode 400 password is not input', async () => {
      let user = {
        name: '1111',
        email: '123@1243.com',
        password: '',
      }

      const res = await chai
        .request(app)
        .post('/api/users/signup')
        .set('Content-Type', 'application/json')
        .send(user)

      res.should.have.status(400)
      res.should.be.json
    })

    it('fails with statuscode 400 email is used', async () => {
      let user = {
        name: '1111',
        email: 'test12@test.com',
        password: 'test12',
      }

      const res = await chai
        .request(app)
        .post('/api/users/signup')
        .set('Content-Type', 'application/json')
        .send(user)

      res.should.have.status(400)
      res.should.be.json
      res.body.message.should.equal('email already exist!')
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})
