import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { playlistAPI } from '../services/api';
import './Playlist.css';

const Playlist = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const loadPlaylist = async () => {
    setLoading(true);
    try {
      const response = await playlistAPI.getById(id);
      setPlaylist(response.data.playlist);
      setTracks(response.data.tracks);
    } catch (err) {
      setError('Failed to load playlist');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="playlist-page">
        <div className="loading">Loading playlist...</div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="playlist-page">
        <div className="error">{error || 'Playlist not found'}</div>
        <Link to="/dashboard" className="back-button">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="playlist-page">
      <div className="playlist-header">
        <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>

        <div className="playlist-info">
          <h1>{playlist.name}</h1>
          <p className="mood-description">"{playlist.mood.text}"</p>

          <div className="mood-analysis">
            <div className="analysis-item">
              <span className="label">Emotion:</span>
              <span className="value emotion">
                {playlist.mood.audioFeatures?.dominantEmotion}
              </span>
            </div>
            <div className="analysis-item">
              <span className="label">Valence:</span>
              <span className="value">
                {(playlist.mood.audioFeatures?.valence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="analysis-item">
              <span className="label">Energy:</span>
              <span className="value">
                {(playlist.mood.audioFeatures?.energy * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="playlist-stats">
            <span>{tracks.length} tracks</span>
            <span>•</span>
            <span>
              {Math.round(tracks.reduce((acc, t) => acc + t.duration, 0) / 60000)} min
            </span>
          </div>

          {playlist.spotifyPlaylistId && (
            <a
              href={playlist.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="spotify-link"
            >
              Open in Spotify
            </a>
          )}
        </div>
      </div>

      <div className="tracks-section">
        <h2>Tracks</h2>
        <div className="tracks-list">
          {tracks.map((track, index) => (
            <div key={track.id} className="track-item">
              <span className="track-number">{index + 1}</span>
              <div className="track-info">
                <div className="track-name">{track.name}</div>
                <div className="track-artist">{track.artist}</div>
              </div>
              <div className="track-album">{track.album}</div>
              <div className="track-duration">
                {formatDuration(track.duration)}
              </div>
              {track.previewUrl && (
                <audio controls className="track-preview">
                  <source src={track.previewUrl} type="audio/mpeg" />
                </audio>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Playlist;
