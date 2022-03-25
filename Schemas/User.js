const mongoose = require('mongoose')
const { Schema, model } = mongoose

const UserSchema = new Schema({
  username : { type: String, required: false  },
  sinceMessageID : { type: Number, required: true },
  telegramID: { type: Number, required: true, unique: true },
  name: { type: String, required: false },
  language: { type: String, required: false },
  referer: { type: Number, required: false },
  session: { type: Number, default: 1 },
  email: { type: String, required: false },
  link: { type: String, required: false, default: "broken_link" },
  trees: {type: Number, default: 0 }, 
});

module.exports = model('User', UserSchema)
