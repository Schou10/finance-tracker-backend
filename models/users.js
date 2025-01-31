const  mongoose = require("mongoose");
const bycript = require('bcryptjs');
const validator = require("validator");



const plaidDataSchema = new mongoose.Schema({
    accessToken: { type: Object, default: null,}, // Encrypted Token is an object
    accountId: {type: String, default: null,},
  
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required:  [true, "The name field is required."],
    minlength: 2,
    maxlegnth: 30
  },
  avatar: {
    type: String,
    required: [true, "The avatar field is required."],
    validate: {
      validator(value){
        return validator.isURL(value);
      },
      message: "You must enter a valid URL."
    }
  },
  email: {
    type: String,
    required: [true, "The email field is required."],
    unique: true,
    validate: {
      validator(value){
        return validator.isEmail(value);
      },
      message: "Wrong email format"
    }
  },
  password: {
    type: String,
    required: [true, "The password field is required."],
    select: false,
  },
  accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }], // Reference to Account model
  plaidData: [plaidDataSchema],
});

userSchema.statics.findUserByCredentials = function (email, password){
   return this.findOne({email}).select("+password")
    .then((user) => {
      if (!user) {
        return Promise.reject(new Error('Incorrect password or email'));
      }
      return bycript.compare(password, user.password)
        .then((matched)=>{
          if (!matched) {
            return Promise.reject(new Error('Incorrect password or email'));
          }
          return user;
        });
    });
}



const User = mongoose.model("User", userSchema);

module.exports = User;