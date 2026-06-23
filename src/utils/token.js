const jwt = require('jsonwebtoken');
const config = require('../config');

function signToken(payload, expiresIn = config.jwt.expire) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = {
  signToken,
  verifyToken,
};
