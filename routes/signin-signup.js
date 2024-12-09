const router = require("express").Router();
const {createUser, login,} = require("../controllers/users");
const {validateSignIn, validateUserBody} = require('../middlewares/validation')

// Route to login
router.post("/signin", validateSignIn ,login);

// Route to create new user
router.post("/signup", validateUserBody, createUser);

module.exports = router;