
import { generateEmbedding } from './embedding.js';
import { search } from './vectorStore.js';
import { getTracksByIds } from './trackStore.js';
import { getFeedbackScores } from './feedbackStore.js';
import type { Track } from '../types/index.js';

// Pure embedding-based search — no LLM calls per search.
// Gemini quota is preserved exclusively for Vibe Generator and AI Curator.
export async function performAISearch(query: string, topK: number = 20, userId?: string, diversity: number = 0): Promise<Track[]> {
  const queryEmbedding = await generateEmbedding(query);

  // Fetch wider pool for diversity sampling
  const fetchCount = Math.max(topK * 2, 40);
  const searchResults = search(queryEmbedding, fetchCount);
  if (searchResults.length === 0) return [];

  const trackIds = searchResults.map((r) => r.id);
  const matchedTracks = getTracksByIds(trackIds);
  const feedbackScores = getFeedbackScores(trackIds, userId);

  // Score = semantic similarity (HNSW distance) + feedback boost
  let scoredTracks = matchedTracks.map((track) => {
    const semanticResult = searchResults.find(r => r.id === track.id);
    const semanticSimilarity = semanticResult ? (1 - semanticResult.distance) : 0.5;
    const feedbackBoost = feedbackScores.get(track.id) || 0;
    const score = semanticSimilarity * 0.9 + feedbackBoost * 0.1;
    return { track, score };
  }).sort((a, b) => b.score - a.score);

  // Diversity: mix top results with random samples from the wider pool
  if (diversity > 0 && scoredTracks.length > topK) {
    const strictCount = Math.max(0, Math.floor(topK * (1 - diversity)));
    const strictTracks = scoredTracks.slice(0, strictCount);
    const remainingPool = scoredTracks.slice(strictCount);
    const sampledTracks: typeof scoredTracks = [];

    const numToSample = Math.min(topK - strictCount, remainingPool.length);
    for (let i = 0; i < numToSample; i++) {
      const randomIndex = Math.floor(Math.random() * remainingPool.length);
      sampledTracks.push(remainingPool[randomIndex]);
      remainingPool.splice(randomIndex, 1);
    }

    scoredTracks = [...strictTracks, ...sampledTracks];
  }

  return scoredTracks.slice(0, topK).map(t => t.track);
}
