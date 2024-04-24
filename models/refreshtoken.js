const mongoose = require('mongoose')

const refreshtokenSchema = new mongoose.Schema({
  email: {
    type: String,
    require: true,
  },
  refresh_token: {
    type: String,
    require: true,
  },
  expires_at: {
    type: Date,
    required: true,
    default: new Date(new Date().getTime() + 1 * 60 * 1000), // convert from minutes to milli seconds
    //https://stackoverflow.com/questions/38472125/delete-mongodb-document-at-specific-time
    expires: 300,
  },
})

module.exports = mongoose.model('RefreshToken', refreshtokenSchema)
