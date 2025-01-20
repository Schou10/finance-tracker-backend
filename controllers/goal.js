const Goal = require('../models/goal');

// Create a new Goal
const createGoal = async (req, res, next) => {
  try {
    const { itemId, goalData } = req.body;
    const goal = await Goal.create({
      userId: req.user._id,
      itemId,
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
    const { goalId } = req.params;
    const updatedGoal = await Goal.findByIdAndUpdate(
      goalId,
      { goalData: req.body.goalData },
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

module.exports = { createGoal, getGoals, updateGoal, deleteGoal };
