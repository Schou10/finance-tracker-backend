module.exports = {
  err400: { status: 400, message: 'Bad Request' },
  err401: {status: 401, message: 'Authorization required'},
  err403: {status: 403, message: "You don't have permission to access this resource"},
  err404: { status: 404, message: 'Not Found' },
  err409: {status: 409, message: "Unable to successfully create or update a resource due to a conflict with the current state of the resource"},
}