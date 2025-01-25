const { err401 } = require("../utils/errors");

class UnauthorizedError extends Error {
  constructor(message = err401.message) {
    super(message);
    this.name = "Unauthorized"
    this.statusCode = 401;
  }
}
module.exports ={ UnauthorizedError}