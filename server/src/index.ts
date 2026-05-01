

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { loadTracks } from './services/trackStore.js';
import { loadUsers } from './services/userStore.js';
import { loadPlaylists } from './services/playlistStore.js';
import { loadFeedback } from './services/feedbackStore.js';
import { initIndex } from './services/vectorStore.js';

import authRoutes from './routes/auth.js';
import searchRoutes from './routes/search.js';
import tracksRoutes from './routes/tracks.js';
import playlistsRoutes from './routes/playlists.js';
import feedbackRoutes from './routes/feedback.js';

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors());
app.use(express.json());

import path from 'path';
const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));


app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/tracks', tracksRoutes);
app.use('/api/playlists', playlistsRoutes);
app.use('/api/feedback', feedbackRoutes);


app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AndrewSound Backend' });
});


async function start() {
  console.log('AndrewSound  Starting server...');


  loadTracks();
  loadUsers();
  loadPlaylists();
  loadFeedback();


  initIndex(500);

  app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
  });
}

start().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});
