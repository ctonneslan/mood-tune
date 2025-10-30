import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Placeholder routes - will implement with Spotify integration
router.get('/auth', (req, res) => {
  res.json({ message: 'Spotify auth - Coming soon' });
});

export default router;
