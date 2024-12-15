const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../errors/unauthorizederror');
const { JWT_SECRET } = require('../utils/config');
const { err401 } =  require('../utils/errors');

const handleAuthError = (next) => next(new UnauthorizedError(err401.message));

const extractBearerToken = (header) => header.replace('Bearer ', '');

module.exports = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    if (!authorization.startsWith('Bearer ')){console.log("Authoriztion does not start with bearer!")}
    return handleAuthError(next);
  }

  const token = extractBearerToken(authorization);

  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return handleAuthError(next);
  }

  req.user = payload;

  return next();
};

