
import { Router } from 'express';
import { performAISearch } from '../services/aiSearchService.js';
import { getFeedbackScores } from '../services/feedbackStore.js';
import { authOptional, type AuthRequest } from '../middleware/auth.js';
import type { TrackWithScore } from '../types/index.js';
import { generateSearchVibe, explainTrackMatch } from '../services/embedding.js';

const router = Router();

// Simple in-memory cache so repeated clicks don't waste quota
const explainCache = new Map<string, string>();

router.post('/', authOptional, async (req: AuthRequest, res) => {
  try {
    const { query, topK = 20, diversity = 0 } = req.body;

    const trimmedQuery = query?.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      res.status(400).json({ error: 'Query must be at least 2 characters' });
      return;
    }

    console.log(`AI Search Request: "${trimmedQuery}", diversity: ${diversity}`);
    const matchedTracks = await performAISearch(trimmedQuery, topK, req.userId, diversity);
    
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

// --- Variant G: Visual Vibe Generator ---
router.post('/vibe', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query?.trim()) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }
    console.log(`Vibe generation for: "${query}"`);
    const vibe = await generateSearchVibe(query.trim());
    res.json({ vibe });
  } catch (error) {
    console.error('Vibe error:', error);
    res.status(500).json({ error: 'Could not generate vibe' });
  }
});

// --- Why this track? (Explainability) ---
router.post('/explain', async (req, res) => {
  try {
    const { query, track } = req.body;
    if (!query?.trim() || !track?.id) {
      res.status(400).json({ error: 'query and track are required' });
      return;
    }

    const cacheKey = `${query.trim()}::${track.id}`;
    if (explainCache.has(cacheKey)) {
      console.log(`Explanation cache hit: ${cacheKey}`);
      res.json({ explanation: explainCache.get(cacheKey) });
      return;
    }

    console.log(`Explaining track "${track.title}" for query "${query}"`);
    const explanation = await explainTrackMatch(query.trim(), track);
    explainCache.set(cacheKey, explanation);
    res.json({ explanation });
  } catch (error: any) {
    console.error('Explain error:', error);
    if (error?.status === 429 || error?.message?.includes('quota')) {
      res.status(429).json({ error: 'Quota exceeded, try again in a moment' });
    } else {
      res.status(500).json({ error: 'Could not generate explanation' });
    }
  }
});

export default router;
