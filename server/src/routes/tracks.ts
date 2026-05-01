
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getAllTracks, getTrackById, getTracksPaginated, addTrack, getNextId, saveTracks } from '../services/trackStore.js';
import { generateTrackEmbedding } from '../services/embedding.js';
import { addVector, saveIndex } from '../services/vectorStore.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'data', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3' || file.mimetype === 'audio/wav') {
      cb(null, true);
    } else {
      cb(new Error('Only .mp3 and .wav files are allowed!'));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 } 
});

router.get('/', (_req, res) => {
  const page = parseInt(_req.query.page as string) || 1;
  const limit = parseInt(_req.query.limit as string) || 20;
  const result = getTracksPaginated(page, limit);
  res.json(result);
});

router.get('/deezer/:deezerId', async (req, res) => {
  try {
    const response = await fetch(`https://api.deezer.com/track/${req.params.deezerId}`);
    if (!response.ok) throw new Error(`Deezer API error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Deezer proxy error:', error);
    res.status(500).json({ error: 'Error calling Deezer API' });
  }
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const track = getTrackById(id);
  if (!track) return res.status(404).json({ error: 'Track not found' });
  res.json(track);
});

router.post('/upload', authRequired, upload.single('audio'), async (req: AuthRequest, res) => {
  try {
    const { title, artist, genre, mood } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
    if (!title || !artist) return res.status(400).json({ error: 'Title and Artist are required' });

    const id = getNextId();
    const track = {
      id,
      title,
      artist,
      genre: genre || 'Local',
      mood: mood || 'Unknown',
      previewUrl: `/uploads/${req.file.filename}`, 
      albumCoverUrl: 'https://via.placeholder.com/300?text=My+Music'
    };

    addTrack(track);
    
    const embedding = await generateTrackEmbedding(track);
    addVector(id, embedding);

    saveTracks();
    saveIndex();

    console.log(`Track uploaded: ${artist} - ${title} (id: ${id})`);
    res.status(201).json(track);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload track' });
  }
});

router.post('/', authRequired, async (req: AuthRequest, res) => {
  try {
    const { title, artist, album, genre, mood } = req.body;
    if (!title || !artist) return res.status(400).json({ error: 'Title and Artist are required' });

    const id = getNextId();
    const track = addTrack({ id, title, artist, album, genre, mood });
    const embedding = await generateTrackEmbedding(track);
    addVector(id, embedding);
    saveTracks();
    saveIndex();
    res.status(201).json(track);
  } catch (error) {
    res.status(500).json({ error: 'Error adding track' });
  }
});

export default router;
