
import { generateEmbedding, expandQuery, rerankTracks } from './embedding.js';
import { search } from './vectorStore.js';
import { getTracksByIds } from './trackStore.js';
import { getFeedbackScores } from './feedbackStore.js';
import type { Track } from '../types/index.js';

export async function performAISearch(query: string, topK: number = 20, userId?: string): Promise<Track[]> {
  const expandedQuery = await expandQuery(query);
  const queryEmbedding = await generateEmbedding(expandedQuery);

  const searchResults = search(queryEmbedding, Math.max(topK, 40)); 
  if (searchResults.length === 0) return [];

  const trackIds = searchResults.map((r) => r.id);
  const initialMatchedTracks = getTracksByIds(trackIds);

  const rerankedIds = await rerankTracks(query, initialMatchedTracks);
  
  const feedbackScores = getFeedbackScores(trackIds, userId);

  const finalTracksWithScores = rerankedIds
    .map((id, index) => {
      const track = initialMatchedTracks.find(t => t.id === id);
      if (!track) return null;

      const semanticResult = searchResults.find(r => r.id === id);
      const semanticSimilarity = semanticResult ? (1 - semanticResult.distance) : 0.5;
      
      const rerankBoost = (rerankedIds.length - index) / rerankedIds.length;
      const feedbackBoost = feedbackScores.get(id) || 0;

      const score = semanticSimilarity * 0.4 + rerankBoost * 0.5 + feedbackBoost * 0.1;
      return { track, score };
    })
    .filter((t): t is { track: Track; score: number } => t !== null)
    .sort((a, b) => b.score - a.score);

  return finalTracksWithScores.slice(0, topK).map(t => t.track);
}
