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

  /*
  expires_at: {
    type: Date,
    default: Date.now(),
    //https://stackoverflow.com/questions/38472125/delete-mongodb-document-at-specific-time
    expires: 1200,
    //expired in 20 min
  },
  */
})

module.exports = mongoose.model('RefreshToken', refreshtokenSchema)
