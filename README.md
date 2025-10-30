# MoodTune - AI-Powered Mood-Based Playlist Generator

An intelligent full-stack application that generates personalized Spotify playlists based on natural language mood descriptions.

## Features

- **Natural Language Mood Input**: Describe your mood in plain English
- **AI-Powered Analysis**: Hugging Face models analyze mood and map to musical characteristics
- **Spotify Integration**: Generates playlists using Spotify's audio features
- **Mood History**: Track your emotional patterns over time
- **User Authentication**: Secure JWT-based authentication

## Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Axios

### Backend
- Node.js
- Express
- PostgreSQL
- JWT Authentication
- Hugging Face Inference API
- Spotify Web API

## Project Structure

```
mood-tune/
├── client/          # React frontend
└── server/          # Express backend
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Spotify Developer Account (https://developer.spotify.com)
- Hugging Face Account (free - https://huggingface.co)

### Installation

1. Clone the repository
```bash
git clone https://github.com/ctonneslan/mood-tune.git
cd mood-tune
```

2. Install dependencies
```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

3. Set up PostgreSQL database
```bash
# Create database
createdb moodtune

# Run schema
psql moodtune < server/database/schema.sql
```

4. Configure environment variables

**Backend (server/.env)**
```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your values:
- `JWT_SECRET`: Random string for JWT signing
- `DB_*`: Your PostgreSQL connection details
- `HUGGINGFACE_API_KEY`: Get from https://huggingface.co/settings/tokens
- `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET`: Get from https://developer.spotify.com/dashboard

**Frontend (client/.env)**
```bash
cp client/.env.example client/.env
```

5. Run the application
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

The app will be available at http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Moods
- `POST /api/moods` - Analyze and save mood
- `GET /api/moods` - Get user's mood history
- `GET /api/moods/:id` - Get specific mood
- `DELETE /api/moods/:id` - Delete mood

### Playlists
- `POST /api/playlists/generate` - Generate playlist from mood
- `GET /api/playlists` - Get user's playlists
- `GET /api/playlists/:id` - Get specific playlist with tracks
- `DELETE /api/playlists/:id` - Delete playlist

### Spotify
- `GET /api/spotify/auth` - Get Spotify OAuth URL
- `GET /api/spotify/callback` - Handle OAuth callback
- `GET /api/spotify/status` - Check connection status
- `POST /api/spotify/disconnect` - Disconnect account

## How It Works

1. **Mood Input**: User describes their mood in natural language
2. **AI Analysis**: Hugging Face models analyze sentiment and emotions
3. **Audio Feature Mapping**: Emotions are mapped to Spotify audio features (valence, energy, etc.)
4. **Track Search**: Spotify API searches for tracks matching the audio profile
5. **Playlist Generation**: Curated playlist is created and stored

## License

MIT
