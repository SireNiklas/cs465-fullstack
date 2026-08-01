const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const {
  CURRENT_ITERATIONS,
  makeSalt,
  hashPassword,
  verifyPassword,
  needsRehash,
} = require('../security/password');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  hash: String,
  salt: String,
  // stored per record so hashes written before the iteration bump still verify
  iterations: { type: Number, default: CURRENT_ITERATIONS },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

userSchema.methods.setPassword = function (password) {
  this.salt = makeSalt();
  this.iterations = CURRENT_ITERATIONS;
  this.hash = hashPassword(password, this.salt, this.iterations);
};

userSchema.methods.validPassword = function (password) {
  return verifyPassword(password, this.salt, this.iterations, this.hash);
};

userSchema.methods.needsRehash = function () {
  return needsRehash(this.iterations);
};

// role travels in the token so authorization does not need a database read on
// every request
userSchema.methods.generateJwt = function () {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role || 'user',
      exp: parseInt(expiry.getTime() / 1000, 10)
    },
    process.env.JWT_SECRET
  );
};

mongoose.model('User', userSchema);
