const router = require("express").Router();
const { err404 } = require("../utils/errors");
const userRouter = require("./users");
const loginSignupRouter = require("./signin-signup");
const { NotFoundError } = require("../errors/notfounderror");
const plaidRouter = require('./plaid')


// User base rooute /users
router.use("/users", userRouter);

// Login-Signup
router.use("", loginSignupRouter);

// Plaid
router.use("", plaidRouter);

// Route response if route is invalid
router.use(() => {
  throw new NotFoundError(err404.message)
});

module.exports = router;