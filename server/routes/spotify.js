import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getAuthUrl,
  handleCallback,
  checkConnection,
  disconnect,
} from '../controllers/spotifyController.js';

const router = express.Router();

// GET /api/spotify/auth - Get Spotify authorization URL
router.get('/auth', getAuthUrl);

// GET /api/spotify/callback - Handle OAuth callback
router.get('/callback', authenticate, handleCallback);

// GET /api/spotify/status - Check connection status
router.get('/status', authenticate, checkConnection);

// POST /api/spotify/disconnect - Disconnect Spotify account
router.post('/disconnect', authenticate, disconnect);

export default router;
