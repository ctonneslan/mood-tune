import pool from '../config/database.js';
import { analyzeMood } from '../services/huggingface.js';

/**
 * Analyze mood text and save to database
 */
export const createMoodAnalysis = async (req, res) => {
  const { moodText } = req.body;
  const userId = req.userId;

  try {
    // Validate input
    if (!moodText || moodText.trim().length === 0) {
      return res.status(400).json({ error: 'Mood text is required' });
    }

    if (moodText.length > 500) {
      return res.status(400).json({ error: 'Mood text must be less than 500 characters' });
    }

    // Analyze mood using Hugging Face
    const analysis = await analyzeMood(moodText);

    // Save to database
    const result = await pool.query(
      `INSERT INTO moods (user_id, mood_text, mood_analysis, audio_features)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, mood_text, mood_analysis, audio_features, created_at`,
      [
        userId,
        moodText,
        JSON.stringify({
          sentiment: analysis.sentiment,
          emotions: analysis.emotions,
        }),
        JSON.stringify(analysis.audioFeatures),
      ]
    );

    const mood = result.rows[0];

    res.status(201).json({
      mood: {
        id: mood.id,
        userId: mood.user_id,
        moodText: mood.mood_text,
        analysis: mood.mood_analysis,
        audioFeatures: mood.audio_features,
        createdAt: mood.created_at,
      },
    });
  } catch (error) {
    console.error('Create mood analysis error:', error);

    if (error.message.includes('Failed to analyze')) {
      return res.status(503).json({
        error: 'Mood analysis service temporarily unavailable. Please try again.'
      });
    }

    res.status(500).json({ error: 'Failed to analyze mood' });
  }
};

/**
 * Get all moods for current user
 */
export const getUserMoods = async (req, res) => {
  const userId = req.userId;
  const { limit = 20, offset = 0 } = req.query;

  try {
    const result = await pool.query(
      `SELECT id, user_id, mood_text, mood_analysis, audio_features, created_at
       FROM moods
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM moods WHERE user_id = $1',
      [userId]
    );

    res.json({
      moods: result.rows.map(mood => ({
        id: mood.id,
        userId: mood.user_id,
        moodText: mood.mood_text,
        analysis: mood.mood_analysis,
        audioFeatures: mood.audio_features,
        createdAt: mood.created_at,
      })),
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get user moods error:', error);
    res.status(500).json({ error: 'Failed to fetch moods' });
  }
};

/**
 * Get a single mood by ID
 */
export const getMoodById = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const result = await pool.query(
      `SELECT id, user_id, mood_text, mood_analysis, audio_features, created_at
       FROM moods
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mood not found' });
    }

    const mood = result.rows[0];

    res.json({
      mood: {
        id: mood.id,
        userId: mood.user_id,
        moodText: mood.mood_text,
        analysis: mood.mood_analysis,
        audioFeatures: mood.audio_features,
        createdAt: mood.created_at,
      },
    });
  } catch (error) {
    console.error('Get mood by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch mood' });
  }
};

/**
 * Delete a mood
 */
export const deleteMood = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const result = await pool.query(
      'DELETE FROM moods WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mood not found' });
    }

    res.json({ message: 'Mood deleted successfully' });
  } catch (error) {
    console.error('Delete mood error:', error);
    res.status(500).json({ error: 'Failed to delete mood' });
  }
};
