const express = require('express')
const router = express.Router()
const Todo = require('../models/todo')
const User = require('../models/user')
const verify = require('../verifyToken')
const { convertObjectId } = require('../utils/method')

// Getting all user's todo
router.get('/', async (req, res) => {
  const todos = await Todo.find().populate('user')
  console.log('get todos....', todos)
  res.status(200).json(todos)
})

//https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose
// Creating one
router.post('/', verify, async (req, res) => {
  let user = await User.findOne({ email: req.user.email })

  if (!user) {
    return res.status(404).json({ message: 'user not found.' })
  }

  console.log('create one', user)

  const todo = new Todo({
    title: req.body.title,
    context: req.body.context,
    username: req.body.username,
    user: user._id,
  })

  await todo.save()

  console.log('save todo', todo)

  if ('todos' in user) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    user.todos = user.todos.concat(todo._id)
  } else {
    user['todos'] = [todo._id]
  }

  await user.save()

  res.status(201).json({ todo, user })
})

// Updating One
router.patch('/:id', verify, getTodo, async (req, res) => {
  let user = await User.findOne({ email: req.user.email })

  if (!user) {
    return res.status(404).json({ message: 'user not found.' })
  }

  if (!res.todo.user.equals(user._id)) {
    res
      .status(404)
      .json({ message: 'you cannot update without authentication' })
  }

  res.todo.title = req.body.title
  res.todo.context = req.body.context
  res.todo.save()

  res.status(200).json({ todo: res.todo })
})

// Deleting One
router.delete('/:id', verify, getTodo, async (req, res) => {
  let user = await User.findOne({ email: req.user.email })

  if (!user) {
    return res.status(404).json({ message: 'user not found.' })
  }

  if (!res.todo.user.equals(user._id)) {
    res
      .status(404)
      .json({ message: 'you cannot delete without authentication' })
  }

  console.log('init delete user', user)

  console.log('res.todo._id', res.todo._id)

  if ('todos' in user) {
    user.todos = user.todos.filter((todo) => !todo.equals(req.params.id))
  } else {
    user['todos'] = []
    console.log("'todos' not in user")
  }

  await user.save()

  await res.todo.remove()

  res.status(204).json({ message: 'delete success!!' })
})

// Get One
router.get('/:id', getTodo, async (req, res) => {
  res.status(200).json({ todo: res.todo })
})

//https://stackoverflow.com/questions/39389823/mongodb-query-with-multiple-conditions
//search todos
router.get('/:keyword', async (req, res) => {
  const todos = await Todo.find({
    $or: [{ title: req.params.keyword }, { context: req.params.keyword }],
  })
  res.status(200).json(todos)
})

async function getTodo(req, res, next) {
  let todo
  try {
    todo = await Todo.findById(req.params.id)
    if (todo == null) {
      return res.status(404).json({ message: 'Cannot find todo' })
    }
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }

  res.todo = todo
  next()
}

module.exports = router
