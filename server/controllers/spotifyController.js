import pool from '../config/database.js';
import {
  getAuthorizationUrl,
  exchangeCodeForToken,
} from '../services/spotify.js';

/**
 * Get Spotify authorization URL
 */
export const getAuthUrl = (req, res) => {
  try {
    const authUrl = getAuthorizationUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Get auth URL error:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
};

/**
 * Handle Spotify OAuth callback
 */
export const handleCallback = async (req, res) => {
  const { code } = req.query;
  const userId = req.userId;

  try {
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for tokens
    const { accessToken, refreshToken, expiresIn } = await exchangeCodeForToken(code);

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Save tokens to database
    await pool.query(
      `UPDATE users
       SET spotify_access_token = $1,
           spotify_refresh_token = $2,
           spotify_token_expires_at = $3
       WHERE id = $4`,
      [accessToken, refreshToken, expiresAt, userId]
    );

    res.json({
      message: 'Spotify account connected successfully',
      expiresAt,
    });
  } catch (error) {
    console.error('Spotify callback error:', error);
    res.status(500).json({ error: 'Failed to connect Spotify account' });
  }
};

/**
 * Check if user has connected Spotify
 */
export const checkConnection = async (req, res) => {
  const userId = req.userId;

  try {
    const result = await pool.query(
      'SELECT spotify_access_token, spotify_token_expires_at FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    const isConnected = !!user.spotify_access_token;
    const isExpired = user.spotify_token_expires_at &&
                      new Date(user.spotify_token_expires_at) < new Date();

    res.json({
      connected: isConnected,
      expired: isExpired,
      expiresAt: user.spotify_token_expires_at,
    });
  } catch (error) {
    console.error('Check Spotify connection error:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
};

/**
 * Disconnect Spotify account
 */
export const disconnect = async (req, res) => {
  const userId = req.userId;

  try {
    await pool.query(
      `UPDATE users
       SET spotify_access_token = NULL,
           spotify_refresh_token = NULL,
           spotify_token_expires_at = NULL
       WHERE id = $1`,
      [userId]
    );

    res.json({ message: 'Spotify account disconnected successfully' });
  } catch (error) {
    console.error('Spotify disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Spotify account' });
  }
};
