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
- Spotify Developer Account
- Hugging Face Account (free)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
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

3. Set up environment variables (see .env.example files)

4. Run the application
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## License

MIT
