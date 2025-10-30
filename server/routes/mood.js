import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Placeholder routes - will implement with Hugging Face integration
router.get('/', authenticate, (req, res) => {
  res.json({ message: 'Mood routes - Coming soon' });
});

export default router;
