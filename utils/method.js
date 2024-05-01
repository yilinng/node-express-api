const mongoose = require('mongoose')

const convertObjectId = (id) => {
  return mongoose.Types.ObjectId(id)
}

module.exports = {
  convertObjectId,
}
