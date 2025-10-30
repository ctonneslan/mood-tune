import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createMoodAnalysis,
  getUserMoods,
  getMoodById,
  deleteMood,
} from '../controllers/moodController.js';

const router = express.Router();

// POST /api/moods - Analyze and save a new mood
router.post('/', authenticate, createMoodAnalysis);

// GET /api/moods - Get all moods for current user
router.get('/', authenticate, getUserMoods);

// GET /api/moods/:id - Get a specific mood
router.get('/:id', authenticate, getMoodById);

// DELETE /api/moods/:id - Delete a mood
router.delete('/:id', authenticate, deleteMood);

export default router;
