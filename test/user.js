process.env.NODE_ENV = "test"

const User = require('../models/user')
const RefreshToken = require('../models/refreshtoken')
const chai = require('chai')
const chaiHttp = require('chai-http')
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');


// Import the application to test
const app = require('../index')
// Configure Chai
chai.should()
chai.use(chaiHttp)

describe('User crud unit test', () => {

  let refreshtoken;
  let accessToken;
  let userstore;
  let todoId;
  User.collection.drop()
  RefreshToken.collection.drop();

  
  beforeEach(async() => {
    const hashedPassword = await bcrypt.hash('test123', 10);

    mockUser = new User({
        name: 'test 123',
        email: 'test123@test.com',
        password: hashedPassword
    });

    await mockUser.save();
  
  }); 

 
  afterEach((done) => {
    User.collection.deleteOne({'email': 'test123@test.com' })
    User.collection.deleteOne({'email': 'test12@test.com' })
    RefreshToken.collection.drop();
    done();
  });
  
  describe('/api/users/login', () => {
    it('should login success', async() => {
      
      let user = {
        email: 'test123@test.com',
        password: 'test123'
      };

      const res = await chai.request(app)
          .post('/api/users/login')
          .set('Content-Type', 'application/json')
          .send(user);

          res.should.have.status(201);
          res.should.be.json;
          refreshtoken = res.body.newToken.refresh_token;
          accessToken = res.body.accessToken;
          userstore = res.body.user
        })
        
  });
  
  describe('/api/users', () => {
    it('should get user success', () => {
        chai.request(app)
            .get('/api/users')
            .set('Content-Type', 'application/json')
            .set("Authorization", 'Bearer ' + accessToken )
            .then(res => {
                  res.should.have.status(200);
                  res.should.be.json;
            })
      });
  });

    
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


  describe('/api/todos', () => {
    it('should post todo success', () => {
      todoId = uuidv4();
      let todo = { 
        "_id": todoId,
        "user_id": userstore._id,
        "username": "John Doe",
        "title": "post one",
        "context":["seventeen", "", "time",""]
      };
      chai.request(app)
          .post('/api/todos')
          .set('Content-Type', 'application/json')
          .set("Authorization", 'Bearer ' + accessToken )
          .send(todo)
          .then(res => {
                res.should.have.status(201);
                res.should.be.json;
              })
          });
      });

  describe('/api/todos', () => {
    it('should get todos success', () => {
      chai.request(app)
          .get('/api/todos')
          .set('Content-Type', 'application/json')
          .set("Authorization", 'Bearer ' + accessToken )
          .then(res => {
              res.should.have.status(200);
              res.should.be.json;
            })
        });
    });
    
    
  describe('/api/todos', () => {
    it('should update todo success', () => {
     
      let todo = { 
        "_id": todoId,
        "user_id": userstore._id,
        "title": "post one from mocha",
        "context":["seventeen", "123", "time","456"]
      };

      chai.request(app)
          .patch('/api/todos')
          .set('Content-Type', 'application/json')
          .set("Authorization", 'Bearer ' + accessToken )
          .send(todo)
          .then(res => {
                res.should.have.status(200);
                res.should.be.json;
                console.log(res, 'should update todo success')         
          })
          
      })
  }); 
    
    
  describe('/api/todos', () => {
    it('should delete todo success', () => {

      let todo = { 
        "_id": todoId
      };

      chai.request(app)
          .delete('/api/todos')
          .set('Content-Type', 'application/json')
          .set("Authorization", 'Bearer ' + accessToken )
          .send(todo)
          .then(res => {
                res.should.have.status(204);
                res.should.be.json;
                res.body.message.should.equal('Deleted Todo!!');     
          })
         
      })
    }); 

  describe('/api/users/logout', () => {
    it('should logout success', () => {
      let token = { refreshtoken };
        chai.request(app)
            .delete('/api/users/logout')
            .set('Content-Type', 'application/json')
            .set("Authorization", 'Bearer ' + accessToken )
            .send(token)
            .then(res => {
                  res.should.have.status(204);
            });
        });
    });

    describe('/api/users/signup', () => {
      it('should signup success', () => {
        let user = {
          name: "test from mocha",
          email: "test12@test.com",
          password: "test12"
        };
          chai.request(app)
              .post('/api/users/signup')
              .send(user)
              .then(res => {
                  res.should.have.status(201);
                  res.should.be.json;
                  res.body.newToken.should.have.property('_id');
                  res.body.newToken.should.have.property('email');
                  res.body.newToken.should.have.property('refresh_token');
                  res.body.newUser.should.have.property('_id');
                  res.body.newUser.should.have.property('name');
                  res.body.newUser.should.have.property('password');
                  res.body.newUser.should.have.property('email');
                  res.body.newUser.name.should.equal(user.name);
                  res.body.newUser.email.should.equal(user.email);
                  refreshtoken = res.body.newToken.refresh_token;
                  accessToken = res.body.accessToken;
                  userstore = res.body.newUser
              });
          });
      });
  
  
});



