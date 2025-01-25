const { err400 } = require("../utils/errors");

class BadRequestError extends Error {
  constructor(message=err400.message) {
    super(message);
    this.name = "Bad Request"
    this.statusCode = 400;
  }
}
module.exports ={BadRequestError}