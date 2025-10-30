import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MoodInput from '../components/MoodInput';
import { moodAPI, playlistAPI } from '../services/api';
import './Home.css';

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleMoodSubmit = async (moodText) => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Analyze mood
      const moodResponse = await moodAPI.create(moodText);
      const mood = moodResponse.data.mood;

      // Step 2: Generate playlist
      const playlistResponse = await playlistAPI.generate({
        moodId: mood.id,
        trackCount: 20,
        saveToSpotify: false, // Can be enabled later with Spotify auth
      });

      const playlist = playlistResponse.data.playlist;

      // Redirect to playlist page
      navigate(`/playlist/${playlist.id}`);
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError(
        err.response?.data?.error ||
        'Failed to generate playlist. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="app-title">
          <span className="emoji">🎵</span>
          MoodTune
        </h1>
        <p className="tagline">
          AI-powered playlists that match your vibe
        </p>
      </div>

      <MoodInput onSubmit={handleMoodSubmit} loading={loading} />

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="features-section">
        <h3>How it works</h3>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">💭</div>
            <h4>Describe Your Mood</h4>
            <p>Tell us how you're feeling in your own words</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🤖</div>
            <h4>AI Analysis</h4>
            <p>Our AI understands your emotions and musical preferences</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🎶</div>
            <h4>Perfect Playlist</h4>
            <p>Get a curated playlist that matches your vibe</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
