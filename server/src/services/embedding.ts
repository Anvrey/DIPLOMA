import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Track } from '../types/index.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('GEMINI_API_KEY not set. Embeddings will not work.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// gemini-2.0-flash has 0 quota on the free tier for this account.
// gemini-2.5-flash is available with 5 RPM / 20 RPD.
const GENERATIVE_MODEL = 'gemini-2.5-flash';


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
    const model = genAI.getGenerativeModel({ model: GENERATIVE_MODEL });
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
    const model = genAI.getGenerativeModel({ model: GENERATIVE_MODEL });
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


// --- Variant G: Visual Vibe Generator ---
export interface SearchVibe {
  mood: string;
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
}

export async function generateSearchVibe(query: string): Promise<SearchVibe> {
  const fallback: SearchVibe = { mood: 'neutral', emoji: '🎵', gradientFrom: '#1a1a2e', gradientTo: '#16213e', accent: '#6c63ff' };
  if (!genAI) return fallback;

  try {
    const model = genAI.getGenerativeModel({ model: GENERATIVE_MODEL });
    const prompt = `You are a music mood expert. Given the search query: "${query}"
Return ONLY a valid JSON object (no markdown, no backticks) with these fields:
- mood: one word describing the music mood (e.g. "melancholic", "energetic", "peaceful", "dark", "romantic", "euphoric")
- emoji: a single emoji representing the mood
- gradientFrom: a dark hex color matching the mood's atmosphere (used as CSS gradient start)
- gradientTo: a slightly different dark hex color (CSS gradient end)
- accent: a brighter accent hex color that complements the mood

Examples:
- Query "sad rainy night" → {"mood":"melancholic","emoji":"🌧️","gradientFrom":"#0d1b2a","gradientTo":"#1b2a38","accent":"#4a90d9"}
- Query "energetic workout" → {"mood":"energetic","emoji":"⚡","gradientFrom":"#1a0a00","gradientTo":"#2d1200","accent":"#ff6b35"}
- Query "calm focus" → {"mood":"peaceful","emoji":"🌿","gradientFrom":"#0a1a0f","gradientTo":"#0f2318","accent":"#52c788"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();
    return { ...fallback, ...JSON.parse(text) };
  } catch (error) {
    console.error('Vibe generation error:', error);
    return fallback;
  }
}

// --- Variant B: AI Playlist Curator ---
export interface PlaylistSegment {
  label: string;
  count: number;
  searchQuery: string;
}

export interface CurationPlan {
  name: string;
  description: string;
  segments: PlaylistSegment[];
}

export async function curatePlaylistFromScenario(scenario: string): Promise<CurationPlan> {
  if (!genAI) throw new Error('GEMINI_API_KEY not configured');

  const model = genAI.getGenerativeModel({ model: GENERATIVE_MODEL });
  const prompt = `You are an expert music curator and playlist designer.
A user described their ideal playlist scenario: "${scenario}"

Analyze the scenario and return ONLY a valid JSON object (no markdown, no backticks) with:
- name: a creative playlist name with an emoji prefix
- description: a short 1-sentence description of the playlist vibe
- segments: array of playlist segments, where each segment has:
  - label: a descriptive name for this part of the playlist
  - count: number of tracks needed (reasonable: 2-6 per segment)
  - searchQuery: an English search query to find matching tracks semantically (e.g. "slow calm piano ambient")

Example for scenario "workout: warmup, intense cardio, cooldown":
{"name":"💪 Power Session","description":"A perfectly paced workout playlist from warm-up to cool-down.","segments":[{"label":"🌅 Warm-up","count":3,"searchQuery":"slow tempo energetic warm up exercise"},{"label":"🔥 Intense Cardio","count":6,"searchQuery":"high BPM fast electronic dance workout cardio"},{"label":"🧘 Cool-down","count":3,"searchQuery":"calm relaxing slow cool down ambient"}]}

Return ONLY the JSON. Be creative with the name and label emojis.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

// --- Why this track? (Explainability) ---
export async function explainTrackMatch(query: string, track: { title: string; artist: string; genre?: string | null; mood?: string | null }): Promise<string> {
  if (!genAI) throw new Error('GEMINI_API_KEY not configured');

  const model = genAI.getGenerativeModel({ model: GENERATIVE_MODEL });
  const prompt = `You are a music recommendation expert. Explain in ONE short sentence (max 20 words) why this track was recommended for the user's search.

User searched for: "${query}"
Recommended track: "${track.title}" by ${track.artist}${track.genre ? `, genre: ${track.genre}` : ''}${track.mood ? `, mood: ${track.mood}` : ''}

Respond with ONLY the explanation sentence. Be specific and mention concrete musical qualities.
Example: "Its dark, slow tempo and heavy guitar riffs perfectly match the melancholic rock vibe you're looking for."`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export const EMBEDDING_DIMENSIONS = 3072;
