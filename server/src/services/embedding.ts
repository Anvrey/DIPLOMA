import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Track } from '../types/index.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('GEMINI_API_KEY not set. Embeddings will not work.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;


export async function generateEmbedding(text: string): Promise<number[]> {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function expandQuery(query: string): Promise<string> {
  if (!genAI) return query;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a music expert. Expand the following user search query into a rich description of genres, moods, and musical characteristics to improve semantic search. 
    User query: "${query}"
    Response should be a short string of keywords and descriptive phrases.
    Example: "very fast music" -> "high tempo, energetic, upbeat, high BPM, electronic dance music, techno, fast rock"
    Example: "calm music" -> "relaxing, peaceful, slow tempo, ambient, piano solo, soft acoustic"
    Return ONLY the expanded description.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    console.log(`Expanded query: "${query}" -> "${text}"`);
    return text;
  } catch (error) {
    console.error('Query expansion error:', error);
    return query;
  }
}

export async function rerankTracks(query: string, tracks: Track[]): Promise<number[]> {
  if (!genAI || tracks.length === 0) return tracks.map(t => t.id);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const trackList = tracks.map(t => `ID: ${t.id} | Title: ${t.title} | Artist: ${t.artist} | Genre: ${t.genre}`).join('\n');

    const prompt = `You are a music ranking expert. A user searched for: "${query}".
    Below is a list of potential track matches. Reorder these tracks from most relevant to least relevant based on the user's intent.
    Pay close attention to keywords like "fast", "slow", "sad", "energetic", etc.
    
    Potential tracks:
    ${trackList}
    
    Return ONLY a JSON array of IDs in the new order.
    Example: [5, 2, 10, 1]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '');
    const orderedIds = JSON.parse(text);
    console.log(`Reranked IDs for "${query}":`, orderedIds);
    return orderedIds;
  } catch (error) {
    console.error('Reranking error:', error);
    return tracks.map(t => t.id);
  }
}

export async function generateTrackEmbedding(track: Track): Promise<number[]> {
  const parts: string[] = [];

  if (track.artist) parts.push(`Artist: ${track.artist}`);
  if (track.title) parts.push(`Title: ${track.title}`);
  if (track.album) parts.push(`Album: ${track.album}`);
  if (track.genre) parts.push(`Genre: ${track.genre}`);
  if (track.mood) parts.push(`Mood: ${track.mood}`);

  const description = parts.join('. ');
  return generateEmbedding(description);
}


export const EMBEDDING_DIMENSIONS = 3072;
