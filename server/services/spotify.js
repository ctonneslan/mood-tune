import axios from 'axios';
import pool from '../config/database.js';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_URL = 'https://accounts.spotify.com';

/**
 * Get Spotify access token using client credentials flow
 * This is for searching tracks without user authentication
 */
export const getClientAccessToken = async () => {
  try {
    const response = await axios.post(
      `${SPOTIFY_ACCOUNTS_URL}/api/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Spotify client token error:', error.response?.data || error.message);
    throw new Error('Failed to get Spotify access token');
  }
};

/**
 * Get user's Spotify access token from database
 */
export const getUserAccessToken = async (userId) => {
  const result = await pool.query(
    'SELECT spotify_access_token, spotify_refresh_token, spotify_token_expires_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  // Check if token is expired
  if (user.spotify_token_expires_at && new Date(user.spotify_token_expires_at) < new Date()) {
    // Refresh token
    return await refreshUserAccessToken(userId, user.spotify_refresh_token);
  }

  return user.spotify_access_token;
};

/**
 * Refresh user's Spotify access token
 */
export const refreshUserAccessToken = async (userId, refreshToken) => {
  try {
    const response = await axios.post(
      `${SPOTIFY_ACCOUNTS_URL}/api/token`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      }
    );

    const { access_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Update database
    await pool.query(
      'UPDATE users SET spotify_access_token = $1, spotify_token_expires_at = $2 WHERE id = $3',
      [access_token, expiresAt, userId]
    );

    return access_token;
  } catch (error) {
    console.error('Spotify token refresh error:', error.response?.data || error.message);
    throw new Error('Failed to refresh Spotify token');
  }
};

/**
 * Search for tracks based on audio features
 * @param {Object} audioFeatures - Audio features from mood analysis
 * @param {number} limit - Number of tracks to return
 */
export const searchTracksByFeatures = async (audioFeatures, limit = 20) => {
  try {
    const accessToken = await getClientAccessToken();

    // Build search query based on mood
    const { dominantEmotion, valence, energy } = audioFeatures;

    // Map emotions to genre/mood keywords
    const moodKeywords = {
      joy: 'happy upbeat pop dance',
      sadness: 'sad melancholic indie acoustic',
      anger: 'intense aggressive rock metal',
      fear: 'dark atmospheric ambient',
      surprise: 'energetic electronic',
      neutral: 'chill relaxed',
    };

    const query = moodKeywords[dominantEmotion] || 'popular';

    // Get recommendations based on audio features
    const response = await axios.get(`${SPOTIFY_API_URL}/recommendations`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        seed_genres: getGenresForMood(dominantEmotion),
        target_valence: valence,
        target_energy: energy,
        target_danceability: audioFeatures.danceability,
        target_acousticness: audioFeatures.acousticness,
        limit: limit,
      },
    });

    return response.data.tracks.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      artists: track.artists.map(a => a.name),
      album: track.album.name,
      uri: track.uri,
      previewUrl: track.preview_url,
      duration: track.duration_ms,
      externalUrl: track.external_urls.spotify,
      image: track.album.images[0]?.url,
    }));
  } catch (error) {
    console.error('Spotify search error:', error.response?.data || error.message);
    throw new Error('Failed to search Spotify tracks');
  }
};

/**
 * Get genre seeds based on dominant emotion
 */
const getGenresForMood = (emotion) => {
  const genreMap = {
    joy: 'pop,dance,party',
    sadness: 'indie,acoustic,sad',
    anger: 'rock,metal,punk',
    fear: 'ambient,electronic,sleep',
    surprise: 'electronic,edm,dance',
    neutral: 'chill,jazz,study',
  };

  return genreMap[emotion] || 'pop,indie,electronic';
};

/**
 * Create a Spotify playlist for a user
 */
export const createSpotifyPlaylist = async (userId, name, description, trackUris) => {
  try {
    const accessToken = await getUserAccessToken(userId);

    // Get user's Spotify ID
    const userResponse = await axios.get(`${SPOTIFY_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const spotifyUserId = userResponse.data.id;

    // Create playlist
    const playlistResponse = await axios.post(
      `${SPOTIFY_API_URL}/users/${spotifyUserId}/playlists`,
      {
        name,
        description,
        public: false,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const playlistId = playlistResponse.data.id;

    // Add tracks to playlist
    if (trackUris && trackUris.length > 0) {
      await axios.post(
        `${SPOTIFY_API_URL}/playlists/${playlistId}/tracks`,
        {
          uris: trackUris,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return {
      id: playlistId,
      name: playlistResponse.data.name,
      externalUrl: playlistResponse.data.external_urls.spotify,
      uri: playlistResponse.data.uri,
    };
  } catch (error) {
    console.error('Create Spotify playlist error:', error.response?.data || error.message);
    throw new Error('Failed to create Spotify playlist');
  }
};

/**
 * Get authorization URL for Spotify OAuth
 */
export const getAuthorizationUrl = () => {
  const scopes = [
    'playlist-modify-private',
    'playlist-modify-public',
    'user-read-private',
    'user-read-email',
  ];

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: scopes.join(' '),
  });

  return `${SPOTIFY_ACCOUNTS_URL}/authorize?${params.toString()}`;
};

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = async (code) => {
  try {
    const response = await axios.post(
      `${SPOTIFY_ACCOUNTS_URL}/api/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  } catch (error) {
    console.error('Spotify code exchange error:', error.response?.data || error.message);
    throw new Error('Failed to exchange code for token');
  }
};
