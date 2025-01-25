const router = require("express").Router();
const { updateUser, getCurrentUser, deleteUser  } = require("../controllers/users");
const {validateUserEdit} = require("../middlewares/validation")
const auth = require("../middlewares/auth");

// Route to update user
router.patch("/me", auth, validateUserEdit, updateUser);

// Route to get Current user
router.get("/me", auth, getCurrentUser);

// Route to delete User Account
router.delete("/me", auth, deleteUser);

module.exports = router;