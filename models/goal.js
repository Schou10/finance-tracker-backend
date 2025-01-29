const mongoose = require('mongoose');
const { Schema } = mongoose;

const GoalSchema = new Schema({
 userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  goalId:{
    type: String,
    unique: true,
    required: true,
  },
  goalData: {
    name: {type: String, required: true },
    description: { type: String, required: true },
    end_date: { type: Date, required: true },
    amount: { type: Number, required: true }, // Total amount to achieve the goal
    currentAmount: { type: Number, default: 0 }, //Tracks progress (defualt to 0)
  },
  createdAt:{
    type: Date,
    default: Date.now,
  },
});

const Goal = mongoose.model('Goal', GoalSchema);

module.exports = Goal;