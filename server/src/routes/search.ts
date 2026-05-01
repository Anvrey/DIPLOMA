
import { Router } from 'express';
import { performAISearch } from '../services/aiSearchService.js';
import { getFeedbackScores } from '../services/feedbackStore.js';
import { authOptional, type AuthRequest } from '../middleware/auth.js';
import type { TrackWithScore } from '../types/index.js';

const router = Router();

router.post('/', authOptional, async (req: AuthRequest, res) => {
  try {
    const { query, topK = 20 } = req.body;

    const trimmedQuery = query?.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      res.status(400).json({ error: 'Query must be at least 2 characters' });
      return;
    }

    console.log(`AI Search Request: "${trimmedQuery}"`);
    const matchedTracks = await performAISearch(trimmedQuery, topK, req.userId);
    
    const trackIds = matchedTracks.map(t => t.id);
    const feedbackScores = getFeedbackScores(trackIds, req.userId);

    const tracksWithScores: TrackWithScore[] = matchedTracks.map((track, index) => {
      const feedbackBoost = feedbackScores.get(track.id) || 0;
      const score = (matchedTracks.length - index) / matchedTracks.length + feedbackBoost * 0.1;
      return { ...track, score };
    });

    res.json({ tracks: tracksWithScores, query: trimmedQuery });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Error processing search query' });
  }
});

export default router;
