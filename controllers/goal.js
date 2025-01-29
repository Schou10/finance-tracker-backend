const {v4: uuidv4 } = require('uuid');
const Goal = require('../models/goal');
const User = require("../models/users");
const {BadRequestError} = require('../errors/badrequesterror');
const {NotFoundError} = require('../errors/notfounderror');
const {UnauthorizedError} = require('../errors/unauthorizederror');

// Create a new Goal
const createGoal = async (req, res, next) => {
  try {
    const { goalData } = req.body;
    const goal = await Goal.create({
      userId: req.user._id,
      goalId: uuidv4(),
      goalData,
    });
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
};

// Get all goals for a user
const getGoals = async (req, res, next) => {
  try { const goals = await Goal.find({ userId: req.user._id });
  res.status(200).json(goals);
} catch (err) {
  next(err);
}
};

// Update a goal
const updateGoal = async (req, res, next) => {
  try{
    const { goalData } = req.body;
    const { goalId } = req.params;
    const updatedGoal = await Goal.findByIdAndUpdate(
      goalId,
      { goalData},
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedGoal)
  } catch (err) {
    next(err);
  }
}

// Delete a goal
const deleteGoal = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    await Goal.findByIdAndDelete(goalId);
    res.status(200).json({ message: 'Goal deleted succesfully'}); 
   } catch (err) {
    next(err);
   }
}

// Save to Goal
const saveToGoal = async (req, res, next) => {
  const { amount } = req.body;
  const { goalId } = req.params;

  if (!amount || amount <= 0) {
    return next(new BadRequestError("Amount Required to save"));
  }

  try {
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return next(new NotFoundError("Goal not Found"));
    }
    if (goal.userId.toString() !== req.user._id) {
      return next(new UnauthorizedError("Unauthorized"));
    }
    // Parsed Amount for Float data
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return next(new BadRequestError("Invalid Amount"));
    }

    // fetch user accounts to see if they hhave enough funds to save to goal
    const user = await User.findById(req.user._id).populate("accounts");
    if (!user){
      return next(new NotFoundError("User not Found"));
    }

    // Check if user has enough funds
    const totalFunds = user.accounts.reduce((sum, account) => sum + account.balance, 0);
    if (totalFunds < parsedAmount) {
      return next(new BadRequestError("Insufficient Funds"));
    }

    // Deduct ammount form user accounts
    let remainingAmount = parsedAmount;
    for (const account of user.accounts) {
      if(remainingAmount <= 0) break;
      if (account.balance >= remainingAmount) {
        account.balance -= remainingAmount;
        await account.save();
        break;
      } else {
        remainingAmount -= account.balance;
        account.balance = 0;
      }
      await account.save();
    }

    // Update goal's current amount
    let newAmount = goal.goalData.currentAmount + parsedAmount;
    if (newAmount > goal.goalData.amount) {
      newAmount = goal.goalData.amount;
    }

    goal.goalData.currentAmount = newAmount;

    const updatedGoal = await goal.save();
    console.log("Updated Goal:", updatedGoal);
    res.status(200).json(updatedGoal);
  } catch (err) {
    next(err);
  }
};

module.exports = { createGoal, getGoals, updateGoal, deleteGoal, saveToGoal };
