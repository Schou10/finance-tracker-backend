const express = require('express');
const { createGoal, getGoals, updateGoal, deleteGoal, saveToGoal } = require('../controllers/goal');
const authMiddleware = require('../middlewares/auth'); // Assuming you have an auth middleware

const router = express.Router();

router.use(authMiddleware); // Protect all goal routes

router.post('', createGoal); // Create a goal
router.get('', getGoals); // Get all goals for the logged-in user
router.patch('/:goalId', updateGoal); // Update a goal
router.delete('/:goalId', deleteGoal); // Delete a goal
router.patch('/:goalId/save', saveToGoal); // Save  amount to goal

module.exports = router;