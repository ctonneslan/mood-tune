import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { playlistAPI, moodAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [playlists, setPlaylists] = useState([]);
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('playlists');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [playlistRes, moodRes] = await Promise.all([
        playlistAPI.getAll({ limit: 20 }),
        moodAPI.getAll({ limit: 20 }),
      ]);
      setPlaylists(playlistRes.data.playlists);
      setMoods(moodRes.data.moods);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      if (type === 'playlist') {
        await playlistAPI.delete(id);
        setPlaylists(playlists.filter(p => p.id !== id));
      } else {
        await moodAPI.delete(id);
        setMoods(moods.filter(m => m.id !== id));
      }
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
      alert(`Failed to delete ${type}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading">Loading your data...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Your Dashboard</h1>
        <Link to="/" className="create-button">
          Create New Playlist
        </Link>
      </div>

      <div className="tabs">
        <button
          className={activeTab === 'playlists' ? 'active' : ''}
          onClick={() => setActiveTab('playlists')}
        >
          Playlists ({playlists.length})
        </button>
        <button
          className={activeTab === 'moods' ? 'active' : ''}
          onClick={() => setActiveTab('moods')}
        >
          Mood History ({moods.length})
        </button>
      </div>

      {activeTab === 'playlists' && (
        <div className="content-section">
          {playlists.length === 0 ? (
            <div className="empty-state">
              <p>No playlists yet</p>
              <Link to="/">Create your first playlist</Link>
            </div>
          ) : (
            <div className="grid">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="card">
                  <div className="card-header">
                    <h3>{playlist.name}</h3>
                    <button
                      onClick={() => handleDelete('playlist', playlist.id)}
                      className="delete-button"
                      title="Delete playlist"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="mood-text">"{playlist.moodText}"</p>
                  <div className="card-footer">
                    <span>{playlist.trackCount} tracks</span>
                    <span>{formatDate(playlist.createdAt)}</span>
                  </div>
                  <Link to={`/playlist/${playlist.id}`} className="view-button">
                    View Playlist
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'moods' && (
        <div className="content-section">
          {moods.length === 0 ? (
            <div className="empty-state">
              <p>No mood history yet</p>
              <Link to="/">Describe your first mood</Link>
            </div>
          ) : (
            <div className="mood-list">
              {moods.map((mood) => (
                <div key={mood.id} className="mood-card">
                  <div className="mood-card-header">
                    <div className="mood-emotion">
                      {mood.audioFeatures?.dominantEmotion || 'neutral'}
                    </div>
                    <button
                      onClick={() => handleDelete('mood', mood.id)}
                      className="delete-button"
                      title="Delete mood"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="mood-text">"{mood.moodText}"</p>
                  <div className="mood-stats">
                    <div className="stat">
                      <span className="label">Valence:</span>
                      <span className="value">
                        {(mood.audioFeatures?.valence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="stat">
                      <span className="label">Energy:</span>
                      <span className="value">
                        {(mood.audioFeatures?.energy * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="mood-date">{formatDate(mood.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
