import axios from 'axios';

const HF_API_URL = 'https://api-inference.huggingface.co/models';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

/**
 * Analyze mood text using Hugging Face sentiment analysis
 * Model: distilbert-base-uncased-finetuned-sst-2-english
 */
export const analyzeSentiment = async (text) => {
  try {
    const response = await axios.post(
      `${HF_API_URL}/distilbert-base-uncased-finetuned-sst-2-english`,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Hugging Face sentiment analysis error:', error.response?.data || error.message);
    throw new Error('Failed to analyze sentiment');
  }
};

/**
 * Analyze emotions in text using emotion classification model
 * Model: j-hartmann/emotion-english-distilroberta-base
 * Returns emotions: anger, disgust, fear, joy, neutral, sadness, surprise
 */
export const analyzeEmotions = async (text) => {
  try {
    const response = await axios.post(
      `${HF_API_URL}/j-hartmann/emotion-english-distilroberta-base`,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Hugging Face emotion analysis error:', error.response?.data || error.message);
    throw new Error('Failed to analyze emotions');
  }
};

/**
 * Map emotions and sentiment to Spotify audio features
 * @param {Object} emotionScores - Emotion scores from HF model
 * @param {Object} sentimentScores - Sentiment scores from HF model
 * @returns {Object} - Mapped audio features for Spotify
 */
export const mapMoodToAudioFeatures = (emotionScores, sentimentScores) => {
  // Get the dominant emotion
  const emotions = emotionScores[0] || [];
  const sortedEmotions = emotions.sort((a, b) => b.score - a.score);
  const dominantEmotion = sortedEmotions[0];

  // Get sentiment
  const sentiment = sentimentScores[0] || [];
  const positiveSentiment = sentiment.find(s => s.label === 'POSITIVE');
  const positivity = positiveSentiment ? positiveSentiment.score : 0.5;

  // Map emotions to Spotify audio features (0.0 to 1.0 scale)
  const audioFeatures = {
    valence: 0.5,      // Positivity of track (happy vs sad)
    energy: 0.5,       // Intensity and activity
    danceability: 0.5, // How suitable for dancing
    acousticness: 0.5, // Acoustic vs electronic
    instrumentalness: 0.3, // Prefer some vocals
    tempo: 120,        // BPM (range: 50-200)
  };

  // Map dominant emotion to audio features
  switch (dominantEmotion?.label) {
    case 'joy':
      audioFeatures.valence = 0.7 + (positivity * 0.3);
      audioFeatures.energy = 0.6 + (positivity * 0.3);
      audioFeatures.danceability = 0.6 + (positivity * 0.2);
      audioFeatures.tempo = 120 + (positivity * 30);
      audioFeatures.acousticness = 0.3;
      break;

    case 'sadness':
      audioFeatures.valence = 0.2 - (positivity * 0.1);
      audioFeatures.energy = 0.3 + (positivity * 0.2);
      audioFeatures.danceability = 0.3;
      audioFeatures.tempo = 80 + (positivity * 20);
      audioFeatures.acousticness = 0.6 + (positivity * 0.2);
      break;

    case 'anger':
      audioFeatures.valence = 0.3;
      audioFeatures.energy = 0.8 + (dominantEmotion.score * 0.2);
      audioFeatures.danceability = 0.5;
      audioFeatures.tempo = 130 + (dominantEmotion.score * 40);
      audioFeatures.acousticness = 0.2;
      break;

    case 'fear':
      audioFeatures.valence = 0.3;
      audioFeatures.energy = 0.6;
      audioFeatures.danceability = 0.4;
      audioFeatures.tempo = 110;
      audioFeatures.acousticness = 0.4;
      break;

    case 'surprise':
      audioFeatures.valence = 0.6 + (positivity * 0.2);
      audioFeatures.energy = 0.7;
      audioFeatures.danceability = 0.6;
      audioFeatures.tempo = 125;
      audioFeatures.acousticness = 0.3;
      break;

    case 'neutral':
      audioFeatures.valence = 0.5;
      audioFeatures.energy = 0.5;
      audioFeatures.danceability = 0.5;
      audioFeatures.tempo = 110;
      audioFeatures.acousticness = 0.4;
      break;

    default:
      // Use sentiment-based defaults
      audioFeatures.valence = positivity;
      audioFeatures.energy = 0.5 + (positivity * 0.3);
      audioFeatures.danceability = 0.5 + (positivity * 0.2);
      audioFeatures.tempo = 100 + (positivity * 40);
  }

  return {
    ...audioFeatures,
    dominantEmotion: dominantEmotion?.label || 'neutral',
    emotionScore: dominantEmotion?.score || 0,
    positivity,
  };
};

/**
 * Complete mood analysis pipeline
 * @param {string} moodText - User's mood description
 * @returns {Object} - Complete mood analysis with audio features
 */
export const analyzeMood = async (moodText) => {
  try {
    // Run both analyses in parallel
    const [sentimentResult, emotionResult] = await Promise.all([
      analyzeSentiment(moodText),
      analyzeEmotions(moodText)
    ]);

    // Map to audio features
    const audioFeatures = mapMoodToAudioFeatures(emotionResult, sentimentResult);

    return {
      originalText: moodText,
      sentiment: sentimentResult,
      emotions: emotionResult,
      audioFeatures,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Complete mood analysis error:', error);
    throw error;
  }
};
