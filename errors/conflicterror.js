const { err409 }= require("../utils/errors");

class ConflictError extends Error {
  constructor(message = err409.message) {
    super(message);
    this. name = "Conflict"
    this.statusCode = 409;
  }
}
module.exports ={ConflictError}