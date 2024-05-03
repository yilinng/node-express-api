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
      //https://stackoverflow.com/questions/38472125/delete-mongodb-document-at-specific-time

})

module.exports = mongoose.model('RefreshToken', refreshtokenSchema)
