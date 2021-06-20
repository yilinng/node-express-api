const { string } = require('joi')
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
   name: {
    type: String,
    min: 6,
    required: true
    },
    email: {
        type: String,
        required: true
      },
      password: {
        type: String,
        required: true
      },
      signUpDate: {
        type: Date,
        required: true,
        default: Date.now
      }
    })

    module.exports = mongoose.model('User', userSchema)