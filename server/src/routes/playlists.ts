



import { Router } from 'express';
import {
  getUserPlaylists,
  getPlaylistById,
  createPlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  deletePlaylist,
  renamePlaylist,
} from '../services/playlistStore.js';
import { getTracksByIds } from '../services/trackStore.js';
import { performAISearch } from '../services/aiSearchService.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';

const router = Router();


router.use(authRequired);


router.get('/', (req: AuthRequest, res) => {
  const playlists = getUserPlaylists(req.userId!);
  res.json({ playlists });
});


router.get('/:id', (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const playlist = getPlaylistById(id);

  if (!playlist) {
    res.status(404).json({ error: '  ' });
    return;
  }

  if (playlist.userId !== req.userId) {
    res.status(403).json({ error: ' ' });
    return;
  }

  const tracks = getTracksByIds(playlist.trackIds);
  res.json({ ...playlist, tracks });
});


router.post('/', (req: AuthRequest, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: '  \'' });
    return;
  }

  const playlist = createPlaylist(req.userId!, name.trim());
  res.status(201).json(playlist);
});


router.post('/ai', async (req: AuthRequest, res) => {
  const { name, query } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Playlist name is required' });
    return;
  }

  if (!query || !query.trim()) {
    res.status(400).json({ error: 'AI prompt is required' });
    return;
  }

  try {
    const tracks = await performAISearch(query.trim(), 15, req.userId);
    const trackIds = tracks.map(t => t.id);

    const playlist = createPlaylist(req.userId!, name.trim(), trackIds);
    res.status(201).json(playlist);
  } catch (error) {
    console.error('AI Playlist error:', error);
    res.status(500).json({ error: 'Failed to generate AI playlist' });
  }
});


router.put('/:id', (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const playlist = getPlaylistById(id);

  if (!playlist) {
    res.status(404).json({ error: '  ' });
    return;
  }

  if (playlist.userId !== req.userId) {
    res.status(403).json({ error: ' ' });
    return;
  }

  const { name, addTrackId, removeTrackId } = req.body;

  let updated = playlist;

  if (name) {
    updated = renamePlaylist(id, name.trim()) || updated;
  }

  if (addTrackId !== undefined) {
    updated = addTrackToPlaylist(id, addTrackId) || updated;
  }

  if (removeTrackId !== undefined) {
    updated = removeTrackFromPlaylist(id, removeTrackId) || updated;
  }

  res.json(updated);
});


router.delete('/:id', (req: AuthRequest, res) => {
  const deleted = deletePlaylist(req.params.id as string, req.userId!);

  if (!deleted) {
    res.status(404).json({ error: '  ' });
    return;
  }

  res.json({ message: ' ' });
});

export default router;
