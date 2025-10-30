import pool from '../config/database.js';
import { searchTracksByFeatures, createSpotifyPlaylist } from '../services/spotify.js';

/**
 * Generate playlist from mood analysis
 */
export const generatePlaylist = async (req, res) => {
  const { moodId, playlistName, trackCount = 20, saveToSpotify = false } = req.body;
  const userId = req.userId;

  try {
    // Validate input
    if (!moodId) {
      return res.status(400).json({ error: 'Mood ID is required' });
    }

    // Get mood from database
    const moodResult = await pool.query(
      'SELECT * FROM moods WHERE id = $1 AND user_id = $2',
      [moodId, userId]
    );

    if (moodResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mood not found' });
    }

    const mood = moodResult.rows[0];
    const audioFeatures = mood.audio_features;

    // Search for tracks based on audio features
    const tracks = await searchTracksByFeatures(audioFeatures, trackCount);

    if (tracks.length === 0) {
      return res.status(404).json({ error: 'No tracks found for this mood' });
    }

    // Generate playlist name if not provided
    const name = playlistName ||
      `${audioFeatures.dominantEmotion.charAt(0).toUpperCase() + audioFeatures.dominantEmotion.slice(1)} Vibes - ${new Date().toLocaleDateString()}`;

    const description = `Generated from mood: "${mood.mood_text}"`;

    // Create playlist in database
    const playlistResult = await pool.query(
      `INSERT INTO playlists (user_id, mood_id, name, description, is_public)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, mood_id, name, description, spotify_playlist_id, is_public, created_at`,
      [userId, moodId, name, description, false]
    );

    const playlist = playlistResult.rows[0];

    // Save tracks to database
    const trackPromises = tracks.map((track, index) =>
      pool.query(
        `INSERT INTO playlist_tracks
         (playlist_id, spotify_track_id, track_name, artist_name, album_name, track_uri, preview_url, duration_ms, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          playlist.id,
          track.id,
          track.name,
          track.artist,
          track.album,
          track.uri,
          track.previewUrl,
          track.duration,
          index,
        ]
      )
    );

    await Promise.all(trackPromises);

    // Optionally create playlist in Spotify
    let spotifyPlaylist = null;
    if (saveToSpotify) {
      try {
        const trackUris = tracks.map(t => t.uri);
        spotifyPlaylist = await createSpotifyPlaylist(userId, name, description, trackUris);

        // Update playlist with Spotify ID
        await pool.query(
          'UPDATE playlists SET spotify_playlist_id = $1 WHERE id = $2',
          [spotifyPlaylist.id, playlist.id]
        );

        playlist.spotify_playlist_id = spotifyPlaylist.id;
      } catch (error) {
        console.error('Failed to create Spotify playlist:', error);
        // Continue without Spotify playlist - we still have it in our DB
      }
    }

    res.status(201).json({
      playlist: {
        id: playlist.id,
        userId: playlist.user_id,
        moodId: playlist.mood_id,
        name: playlist.name,
        description: playlist.description,
        spotifyPlaylistId: playlist.spotify_playlist_id,
        spotifyUrl: spotifyPlaylist?.externalUrl,
        isPublic: playlist.is_public,
        createdAt: playlist.created_at,
        trackCount: tracks.length,
      },
      tracks: tracks.map((track, index) => ({
        position: index,
        id: track.id,
        name: track.name,
        artist: track.artist,
        artists: track.artists,
        album: track.album,
        uri: track.uri,
        previewUrl: track.previewUrl,
        duration: track.duration,
        externalUrl: track.externalUrl,
        image: track.image,
      })),
    });
  } catch (error) {
    console.error('Generate playlist error:', error);

    if (error.message.includes('Failed to search')) {
      return res.status(503).json({
        error: 'Music service temporarily unavailable. Please try again.'
      });
    }

    res.status(500).json({ error: 'Failed to generate playlist' });
  }
};

/**
 * Get all playlists for current user
 */
export const getUserPlaylists = async (req, res) => {
  const userId = req.userId;
  const { limit = 20, offset = 0 } = req.query;

  try {
    const result = await pool.query(
      `SELECT
         p.*,
         m.mood_text,
         COUNT(pt.id) as track_count
       FROM playlists p
       LEFT JOIN moods m ON p.mood_id = m.id
       LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
       WHERE p.user_id = $1
       GROUP BY p.id, m.mood_text
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM playlists WHERE user_id = $1',
      [userId]
    );

    res.json({
      playlists: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        moodId: row.mood_id,
        moodText: row.mood_text,
        name: row.name,
        description: row.description,
        spotifyPlaylistId: row.spotify_playlist_id,
        isPublic: row.is_public,
        trackCount: parseInt(row.track_count),
        createdAt: row.created_at,
      })),
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get user playlists error:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
};

/**
 * Get a single playlist with tracks
 */
export const getPlaylistById = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const playlistResult = await pool.query(
      `SELECT p.*, m.mood_text, m.mood_analysis, m.audio_features
       FROM playlists p
       LEFT JOIN moods m ON p.mood_id = m.id
       WHERE p.id = $1 AND p.user_id = $2`,
      [id, userId]
    );

    if (playlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const playlist = playlistResult.rows[0];

    // Get tracks
    const tracksResult = await pool.query(
      `SELECT * FROM playlist_tracks
       WHERE playlist_id = $1
       ORDER BY position ASC`,
      [id]
    );

    res.json({
      playlist: {
        id: playlist.id,
        userId: playlist.user_id,
        moodId: playlist.mood_id,
        moodText: playlist.mood_text,
        name: playlist.name,
        description: playlist.description,
        spotifyPlaylistId: playlist.spotify_playlist_id,
        isPublic: playlist.is_public,
        createdAt: playlist.created_at,
        trackCount: tracksResult.rows.length,
        mood: {
          text: playlist.mood_text,
          analysis: playlist.mood_analysis,
          audioFeatures: playlist.audio_features,
        },
      },
      tracks: tracksResult.rows.map(track => ({
        id: track.id,
        spotifyTrackId: track.spotify_track_id,
        name: track.track_name,
        artist: track.artist_name,
        album: track.album_name,
        uri: track.track_uri,
        previewUrl: track.preview_url,
        duration: track.duration_ms,
        position: track.position,
      })),
    });
  } catch (error) {
    console.error('Get playlist by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
};

/**
 * Delete a playlist
 */
export const deletePlaylist = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const result = await pool.query(
      'DELETE FROM playlists WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
};
