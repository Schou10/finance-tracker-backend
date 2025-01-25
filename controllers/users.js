const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { BadRequestError } = require('../errors/badrequesterror');
const { UnauthorizedError } = require('../errors/unauthorizederror');
const { NotFoundError } = require('../errors/notfounderror');
const { ConflictError } = require('../errors/conflicterror');
const User = require("../models/users");
const { JWT_SECRET } = require("../utils/config");



// POST /users creates a new user
const createUser = (req, res, next) => {
  const {name, avatar, email, password} = req.body;
  bcrypt.hash(password, 10)
  .then((hash) => User.create({name, avatar, email, password: hash}))
  .then((user)=> res.status(201).send({
    _id: user._id,
    email: user.email,
  }))
  .catch((err)=>{
    if(err.code === 11000){
      next(new ConflictError("Email already exists"));
    }
    if (err.name === "ValidationError"){
      next(new BadRequestError("Invalid input data"));
    }
    next(err)
  });
}


// Post /signin login
const login = (req, res, next) => {
  const { email, password } = req.body;
  if(!email || !password){
    next( new NotFoundError("Email and password are required"));
  }
  return User.findUserByCredentials(email, password)
  .then((user) => {
    const token = jwt.sign({ _id: user._id }, JWT_SECRET,
      { expiresIn: '7d' })
    res.send({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }
    });
  })
    .catch((err) => {
      if (err.message === "Incorrect password or email"){
       next( new UnauthorizedError("Incorrect password or email"));
      }
      next(err)
    });
};
// PATCH
const updateUser = (req, res, next)=>{
    const  userId  = req.user._id;
    const { name, avatar } = req.body;
    // Validate that both name and avatar are provided
    if (!name || !avatar) {
      next( new BadRequestError("Both name and avatar fields are required"));
    }
    // Find user by ID and update name and avatar
    return User.findByIdAndUpdate(
      userId,
      { name, avatar },  // Only update name and avatar
      { new: true, runValidators: true }  // Return the updated document, run validators
    )
    .orFail()
    .then((updatedUser) => res.status(200).send(updatedUser))
    .catch ((err) => {
      if (err.message === "DocumentNotFoundError") {
      next(new NotFoundError("User not found"));
    } if (err.name === "ValidationError") {
      next( new BadRequestError("Invalid input data"));
    }
    next(err)
  });
}

// GET Current User
const getCurrentUser = (req, res, next)=> {
  const  userId  = req.user._id;
  if(!userId){
    throw new NotFoundError("User not found");
  }
  return User.findById(userId)
  .orFail()
  .then((user)=> res.status(200).send(user))
  .catch((err)=>{
    if (err.name === "ValidationError"){
      next(new BadRequestError("Invalid input data"));
    }
    next(err)
  });
}

const deleteUser = (req, res, next) => {
  const userId = req.user._id;
  return User.findByIdAndDelete(userId)
  .then(() => res.status(200).send({ message: "User deleted successfully" }))
  .catch((err) => {
    if (err.name === "DocumentNotFoundError") {
      next(new NotFoundError("User not found"));
    }
    next(err);
  });
};

module.exports =  {  createUser,  login, updateUser, getCurrentUser, deleteUser };