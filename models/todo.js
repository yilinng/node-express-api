const mongoose = require('mongoose')

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  context: {
    type: [String],
    default: [],
  },
  username: {
    type: String,
  },
  updateDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
})

todoSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

module.exports = mongoose.model('Todo', todoSchema)
