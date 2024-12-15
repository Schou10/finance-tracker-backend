const mongoose = require('mongoose');
const { Schema } = mongoose;

const TransactionSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  iv: {
    type: String,
    required: true,
  },
});

const Transaction= mongoose.model('Transaction', TransactionSchema);
module.exports = Transaction;