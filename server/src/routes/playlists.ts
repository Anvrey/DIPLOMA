



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
import { getTracksByIds, getAllTracks } from '../services/trackStore.js';
import { performAISearch } from '../services/aiSearchService.js';
import { curatePlaylistFromScenario, generateEmbedding } from '../services/embedding.js';
import { search } from '../services/vectorStore.js';
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


// --- Variant B: AI Playlist Curator ---
// Gemini plans the structure (JSON), then HNSW fills each segment with real tracks
router.post('/curate', async (req: AuthRequest, res) => {
  const { scenario } = req.body;

  if (!scenario?.trim()) {
    res.status(400).json({ error: 'Scenario description is required' });
    return;
  }

  try {
    console.log(`AI Curation request: "${scenario}"`);

    // Step 1: Gemini plans the playlist structure (1 LLM call)
    const plan = await curatePlaylistFromScenario(scenario.trim());
    console.log('Curation plan:', JSON.stringify(plan));

    // Step 2: For each segment, embed the query and search HNSW (no extra LLM calls)
    const usedTrackIds = new Set<number>();
    const segmentsWithTracks = await Promise.all(
      plan.segments.map(async (segment) => {
        const embedding = await generateEmbedding(segment.searchQuery);
        const results = search(embedding, segment.count * 3); // fetch more to allow dedup
        const trackIds = results
          .map(r => r.id)
          .filter(id => !usedTrackIds.has(id))
          .slice(0, segment.count);
        trackIds.forEach(id => usedTrackIds.add(id));
        const tracks = getTracksByIds(trackIds);
        return { label: segment.label, tracks };
      })
    );

    // Step 3: Flatten all track IDs preserving segment order
    const allTrackIds = segmentsWithTracks.flatMap(s => s.tracks.map(t => t.id));

    // Save as playlist (only if user is logged in)
    let savedPlaylist = null;
    if (req.userId) {
      savedPlaylist = createPlaylist(req.userId, plan.name, allTrackIds);
    }

    res.status(201).json({
      plan,
      segments: segmentsWithTracks,
      playlist: savedPlaylist,
    });
  } catch (error: any) {
    console.error('Curation error:', error);
    // Forward Gemini rate-limit errors as 429 so the client can show a targeted message
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
      res.status(429).json({ error: 'Gemini API quota exceeded. Please wait a moment and try again.' });
    } else {
      res.status(500).json({ error: 'Failed to curate playlist' });
    }
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
