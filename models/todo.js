const mongoose = require('mongoose')

const todoSchema = new mongoose.Schema({
  _id: {
    type: String, 
    required: true
  },
  title: {
    type: String,
  },
  context: {
    type: [String],
    default: []
  },
  username: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  updateDate: {
    type: Date,
    required: true,
    default: Date.now
  }
})

module.exports = mongoose.model('Todo', todoSchema)