import { useState } from 'react';
import './MoodInput.css';

const MoodInput = ({ onSubmit, loading }) => {
  const [moodText, setMoodText] = useState('');
  const [error, setError] = useState('');

  const quickMoods = [
    { emoji: '😊', text: 'Happy and upbeat, ready to dance' },
    { emoji: '😢', text: 'Feeling melancholic and reflective' },
    { emoji: '😌', text: 'Calm and peaceful, want to relax' },
    { emoji: '🔥', text: 'Energetic and pumped up' },
    { emoji: '🌙', text: 'Late night vibes, introspective' },
    { emoji: '☕', text: 'Cozy morning, acoustic feels' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!moodText.trim()) {
      setError('Please describe your mood');
      return;
    }

    if (moodText.length > 500) {
      setError('Mood description must be less than 500 characters');
      return;
    }

    onSubmit(moodText);
  };

  const handleQuickMood = (text) => {
    setMoodText(text);
  };

  return (
    <div className="mood-input-container">
      <h2>How are you feeling?</h2>
      <p className="subtitle">Describe your mood and we'll create the perfect playlist</p>

      <form onSubmit={handleSubmit} className="mood-form">
        <textarea
          value={moodText}
          onChange={(e) => setMoodText(e.target.value)}
          placeholder="Example: I feel melancholic but hopeful, like watching rain from a cozy cafe..."
          rows={4}
          disabled={loading}
          maxLength={500}
          className="mood-textarea"
        />

        <div className="char-count">
          {moodText.length} / 500
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          disabled={loading || !moodText.trim()}
          className="submit-button"
        >
          {loading ? 'Analyzing...' : 'Generate Playlist'}
        </button>
      </form>

      <div className="quick-moods">
        <p className="quick-moods-label">Or try a quick mood:</p>
        <div className="quick-moods-grid">
          {quickMoods.map((mood, index) => (
            <button
              key={index}
              onClick={() => handleQuickMood(mood.text)}
              disabled={loading}
              className="quick-mood-button"
              title={mood.text}
            >
              <span className="emoji">{mood.emoji}</span>
              <span className="mood-text">{mood.text.split(',')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoodInput;
