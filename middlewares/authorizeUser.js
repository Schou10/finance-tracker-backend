const { UnauthorizedError } = require("../errors/unauthorizederror");
const  { err403 } = require( "../utils/errors");


module.exports = (req, res, next) => {
  const userId = req.user_id // Retrieved from auth middleware
  const ownerId = req.params.userId || req.body.userId;

  if (userId !== ownerId) {
    next(new UnauthorizedError(err403.message));
  }
  next();
}