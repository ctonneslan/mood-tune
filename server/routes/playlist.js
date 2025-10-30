import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Placeholder routes - will implement with playlist generation logic
router.get('/', authenticate, (req, res) => {
  res.json({ message: 'Playlist routes - Coming soon' });
});

export default router;
