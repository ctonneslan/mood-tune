import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  generatePlaylist,
  getUserPlaylists,
  getPlaylistById,
  deletePlaylist,
} from '../controllers/playlistController.js';

const router = express.Router();

// POST /api/playlists/generate - Generate playlist from mood
router.post('/generate', authenticate, generatePlaylist);

// GET /api/playlists - Get all playlists for current user
router.get('/', authenticate, getUserPlaylists);

// GET /api/playlists/:id - Get a specific playlist with tracks
router.get('/:id', authenticate, getPlaylistById);

// DELETE /api/playlists/:id - Delete a playlist
router.delete('/:id', authenticate, deletePlaylist);

export default router;
