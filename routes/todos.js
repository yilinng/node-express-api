const express = require('express');
const router = express.Router();
const Todo = require('../models/todo');
const verify = require('../verifyToken');

// Getting all user's todo
router.get('/', verify, async (req, res) => {
  try {
    const todos = await Todo.find()
    res.status(200).json(todos)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
});


// Creating one
router.post('/', verify, async (req, res) => {

  const todo = new Todo({
    _id: req.body._id,
    title: req.body.title,
    context: req.body.context,
    username: req.body.username,
    user_id: req.body.user_id
  })
  try {
    const newTodo = await todo.save()
    res.status(201).json(newTodo)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
});

// Updating One
router.patch('/', verify, getTodo, async (req, res) => {
 
  try{
    const todo = await Todo.updateOne(
      { _id: req.body._id}, 
      {$set: {
        title: req.body.title, 
        context: req.body.context, 
       }});
    res.status(200).json(todo);  
    } catch(err) {
      res.status(400).json(err);
    }

});

// Deleting One
router.delete('/', verify, getTodo, async (req, res) => {
  try {
    await res.todo.remove()
    res.status(204).json({ message: 'Deleted Todo!!' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
});

async function getTodo(req, res, next) {
  let todo
  try {
    todo = await Todo.findById(req.body._id)
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