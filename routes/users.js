const router = require("express").Router();
const { updateUser, getCurrentUser  } = require("../controllers/users");
const {validateUserEdit} = require("../middlewares/validation")
const auth = require("../middlewares/auth");

// Route to update user
router.patch("/me", auth, validateUserEdit,updateUser);

router.get("/me", auth, getCurrentUser);

module.exports = router;