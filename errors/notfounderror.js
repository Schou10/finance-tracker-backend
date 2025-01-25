const {err404} = require('../utils/errors');

class NotFoundError extends Error {
  constructor(message = err404.message) {
    super(message);
    this.name = "Not Found"
    this.statusCode = 404;
  }
}
module.exports ={NotFoundError}