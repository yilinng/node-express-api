const User = require('../models/user')
const Todo = require('../models/todo')
const RefreshToken = require('../models/refreshtoken')
const chai = require('chai')
const chaiHttp = require('chai-http')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

// Import the application to test
const app = require('../index')
// Configure Chai
chai.should()
chai.use(chaiHttp)

//https://stackoverflow.com/questions/44149096/for-async-tests-and-hooks-ensure-done-is-called-if-returning-a-promise-en

describe('Todo crud unit test', () => {
  let accessToken
  let userstore

  User.collection.drop()
  Todo.collection.drop()
  RefreshToken.collection.drop()

  const nonExistingId = async () => {
    const todo = new Todo({ title: 'willremovethissoon', user: userstore._id })
    await todo.save()
    await todo.deleteOne()

    return todo._id.toString()
  }

  const todosInDb = async () => {
    const todos = await Todo.find({})
    return todos.map((todo) => todo.toJSON())
  }

  before(async () => {
    const hashedPassword = await bcrypt.hash('test123', 10)

    mockUser = new User({
      name: 'test 123',
      email: 'test123@test.com',
      password: hashedPassword,
    })

    await mockUser.save()

    let user = {
      email: 'test123@test.com',
      password: 'test123',
    }

    await chai
      .request(app)
      .post('/api/users/login')
      .set('Content-Type', 'application/json')
      .send(user)
      .then((res) => {
        accessToken = res.body.accessToken
        userstore = res.body.user
      })

    mockTodo = new Todo({
      user: mockUser._id,
      username: 'Test here',
      title: 'testTitle',
      context: ['test context...'],
    })

    await mockTodo.save()

    console.log('mockTodo', mockTodo)
  })

  describe('addition of a new todo', () => {
    it('should post todo success', async () => {
      let todo = {
        user: userstore._id,
        username: 'John Doe',
        title: 'post one',
        context: ['seventeen', '', 'time', ''],
      }

      const res = await chai
        .request(app)
        .post('/api/todos')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .send(todo)

      res.should.have.status(201)
      res.should.be.json
    })
  })

  describe('all todos are returned', () => {
    it('should get todos success', async () => {
      const res = await chai
        .request(app)
        .get('/api/todos')
        .set('Content-Type', 'application/json')

      res.should.have.status(200)
      res.should.be.json
    })
  })

  describe('viewing a specific todo', () => {
    it('should update todo success', async () => {
      const todosAtStart = await todosInDb()

      const todoToView = todosAtStart[0]
      console.log('todoToView', todoToView, todoToView.id, todoToView._id)
      let todo = {
        user: userstore._id,
        title: 'post one from mocha',
        context: ['seventeen', '123', 'time', '456'],
      }

      const res = await chai
        .request(app)
        .patch(`/api/todos/${todoToView.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .send(todo)

      console.log('update response', res.body)

      res.should.have.status(200)
      res.should.be.json
    })

    it('should delete todo success', async () => {
      const todosAtStart = await todosInDb()

      const todoToView = todosAtStart[0]

      console.log(' delete todoToView', todoToView, todoToView.id)

      await chai
        .request(app)
        .delete(`/api/todos/${todoToView.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .then((res) => {
          console.log('delete res', res.body)
          res.should.have.status(204)
        })
    })

    it('fails with statuscode 404 if todo does not exist', async () => {
      const validNonexistingId = await nonExistingId()

      const res = await chai
        .request(app)
        .get(`/api/todos/${validNonexistingId}`)
        .set('Content-Type', 'application/json')

      console.log('fail response', res.body)
      res.should.have.status(404)
    })

    it('fails with statuscode 500 id is invalid', async () => {
      const invalidId = '5a3d5da59070081a82a3445'

      const res = await chai
        .request(app)
        .get(`/api/todos/${invalidId}`)
        .set('Content-Type', 'application/json')

      res.should.have.status(500)
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})
