class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "Bad Request"
    this.statusCode = 400;
  }
}
module.exports ={BadRequestError}