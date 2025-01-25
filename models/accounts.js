const mongoose = require('mongoose');
const { Schema } = mongoose;

const AccountSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accountData: {
    type: Object, // Encrypted account details for short term storage
    required: true,
  },
  createdAt:{
    type: Date,
    default: Date.now,
  }
});

const Account = mongoose.model('Account', AccountSchema);

module.exports = Account;