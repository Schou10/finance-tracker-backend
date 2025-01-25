const { err403 } = require("../utils/errors");

class ForbiddenError extends Error {
  constructor(message = err403.message) {
    super(message);
    this.name = "Forbidden"
    this.statusCode = 403;
  }
}
module.exports ={ForbiddenError}