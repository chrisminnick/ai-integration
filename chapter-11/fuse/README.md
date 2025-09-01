# FUSE: Find, Understand, Search, Enhance

A teaching demo application for experimenting with search and recommendation techniques. FUSE combines traditional keyword indexing with vector-based embeddings and demonstrates semantic, hybrid, and personalized search.

## Features

- **Keyword Search**: Traditional full-text search against document metadata
- **Vector Search**: Embedding-based semantic search using OpenAI embeddings
- **Hybrid Search**: Combines keyword and vector search with adjustable weights
- **Personalized Recommendations**: User interaction tracking and profile-based recommendations
- **Real-time Feedback**: Like, save, and mark documents as not relevant to improve recommendations

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (for metadata and user interactions)
- **Vector Store**: In-memory with SQLite storage
- **Embeddings**: OpenAI API (`text-embedding-3-small`)

## Installation & Setup

1. **Clone and navigate to the FUSE directory**:

   ```bash
   cd chapter-11/fuse
   ```

2. **Install all dependencies**:

   ```bash
   npm run install:all
   ```

3. **Set up environment variables**:

   ```bash
   cd server
   cp .env.example .env
   ```

   Edit `.env` and add your OpenAI API key:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```

4. **Load sample data and build search index**:

   ```bash
   npm run load
   ```

5. **Start the development servers**:

   ```bash
   cd ..  # Back to fuse root
   npm run dev
   ```

   This will start:

   - Backend server on http://localhost:3001
   - Frontend client on http://localhost:3000

## Usage

### Search Modes

1. **Keyword Search**: Traditional text matching based on exact word matches
2. **Semantic Search**: Vector similarity search using OpenAI embeddings
3. **Hybrid Search**: Combines both approaches with weighted scoring (30% keyword, 70% semantic)

### User Interactions

- **👍 Like**: Positive feedback that influences recommendations
- **📎 Save**: Mark as important for your profile
- **👎 Not Relevant**: Negative feedback to improve future results

### API Endpoints

- `POST /api/search` - Search documents
- `POST /api/recommend` - Get personalized recommendations
- `POST /api/feedback` - Record user interactions
- `GET /api/interactions/:userId` - Get user interaction history
- `GET /api/health` - Health check

## Project Structure

```
fuse/
├── package.json                 # Root package with dev scripts
├── README.md                   # This file
├── server/                     # Backend Express API
│   ├── package.json
│   ├── server.js              # Main Express server
│   ├── load-data.js           # Data loading and embedding generation
│   ├── utils.js               # Search utilities and algorithms
│   ├── dataset.json           # Sample documents
│   ├── fuse.db               # SQLite database (generated)
│   └── .env.example          # Environment template
└── client/                    # Frontend React app
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx           # Main React component
        └── index.css         # Styles
```

## Development

### Adding New Documents

1. Edit `server/dataset.json` to add new documents
2. Run `npm run load` to regenerate embeddings and update the database

### Customizing Search Algorithms

- Edit `server/utils.js` to modify search algorithms
- Adjust hybrid search weights in the `/api/search` endpoint
- Customize recommendation logic in the `/api/recommend` endpoint

### Frontend Modifications

- Edit `client/src/App.jsx` for UI changes
- Modify `client/src/index.css` for styling
- The client proxies API requests to the backend automatically

## Educational Use

FUSE is designed to help understand:

1. **Search Evolution**: Compare keyword vs semantic vs hybrid approaches
2. **Vector Embeddings**: See how semantic similarity works in practice
3. **Personalization**: Observe how user interactions influence recommendations
4. **Hybrid Systems**: Learn to balance different ranking signals

## License

MIT License - Educational/demo software only. No warranties for production use.

## Troubleshooting

### Common Issues

1. **"OPENAI_API_KEY not found"**: Make sure you've set up the `.env` file in the server directory
2. **Database errors**: Delete `server/fuse.db` and run `npm run load` again
3. **Port conflicts**: Change the PORT in `.env` and update the proxy in `client/vite.config.js`

### Data Reset

To reset all data and start fresh:

```bash
cd server
rm fuse.db
npm run load
```
