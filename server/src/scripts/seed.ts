import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { generateTrackEmbedding } from '../services/embedding.js';
import { initIndex, addVector, saveIndex } from '../services/vectorStore.js';
import type { Track } from '../types/index.js';

const DATA_DIR = path.join(import.meta.dirname, '..', 'data');
const TRACKS_PATH = path.join(DATA_DIR, 'tracks.json');


const SEARCH_QUERIES = [
  { query: 'pop hits', genre: 'Pop' },
  { query: 'rock classic', genre: 'Rock' },
  { query: 'electronic dance', genre: 'Electronic' },
  { query: 'jazz smooth', genre: 'Jazz' },
  { query: 'classical piano', genre: 'Classical' },
  { query: 'hip hop rap', genre: 'Hip-Hop' },
  { query: 'ambient chill', genre: 'Ambient' },
  { query: 'indie alternative', genre: 'Indie' },
  { query: 'lo-fi beats', genre: 'Lo-Fi' },
  { query: 'latin reggaeton', genre: 'Latin' },
  { query: 'heavy metal', genre: 'Metal' },
  { query: 'country hits', genre: 'Country' },
  { query: 'soul classic', genre: 'Soul' },
  { query: 'reggae vibes', genre: 'Reggae' },
  { query: 'techno rave', genre: 'Techno' },
  { query: 'house music', genre: 'House' },
  { query: 'k-pop top', genre: 'K-Pop' },
  { query: 'j-pop anime', genre: 'J-Pop' },
  { query: 'movie soundtracks', genre: 'Soundtrack' },
  { query: 'blues soul', genre: 'Blues' },
];

const TRACKS_PER_GENRE = 10;

interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string };
  album: { title: string; cover_medium: string };
  preview: string;
  link: string;
}

interface DeezerSearchResponse {
  data: DeezerTrack[];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


async function fetchDeezerTracks(query: string, limit: number): Promise<DeezerTrack[]> {
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Deezer API : ${response.status}`);
  }

  const data: DeezerSearchResponse = await response.json();
  return data.data || [];
}

async function seed() {
  console.log('Починаємо заповнення бази...\n');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  initIndex(500);

  const allTracks: Track[] = [];
  let trackId = 1;
  const seenTitles = new Set<string>();

  for (const { query, genre } of SEARCH_QUERIES) {
    console.log(`Пошук: "${query}" (Жанр: ${genre})...`);

    try {
      const deezerTracks = await fetchDeezerTracks(query, TRACKS_PER_GENRE + 5);
      let count = 0;

      for (const dt of deezerTracks) {
        if (count >= TRACKS_PER_GENRE) break;

        const key = `${dt.artist.name}-${dt.title}`.toLowerCase();
        if (seenTitles.has(key)) continue;
        seenTitles.add(key);

        const track: Track = {
          id: trackId++,
          title: dt.title,
          artist: dt.artist.name,
          album: dt.album.title,
          genre,
          previewUrl: dt.preview,
          albumCoverUrl: dt.album.cover_medium,
          deezerLink: dt.link,
        };

        allTracks.push(track);
        count++;
      }

      console.log(`Додано ${count} треків для "${genre}"`);
    } catch (error) {
      console.error(`Помилка для "${query}":`, error);
    }

    await delay(300);
  }

  console.log(`\nВсього знайдено треків: ${allTracks.length}`);
  console.log('Генеруємо вектори (AI-аналіз)...\n');

  for (let i = 0; i < allTracks.length; i++) {
    const track = allTracks[i];
    try {
      const embedding = await generateTrackEmbedding(track);

      addVector(i, embedding);

      track.id = i;

      fs.writeFileSync(TRACKS_PATH, JSON.stringify(allTracks, null, 2), 'utf-8');
      saveIndex();

      console.log(`Оброблено ${i + 1}/${allTracks.length} треків...`);

      await delay(1500);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`Помилка для "${track.artist} - ${track.title}":`, msg);

      if (msg.includes('429')) {
        console.log('Ліміт вичерпано. Чекаємо 60 сек...');
        await delay(60000);
      }
    }
  }

  fs.writeFileSync(TRACKS_PATH, JSON.stringify(allTracks, null, 2), 'utf-8');
  saveIndex();

  console.log('\nБазу AndrewSound успішно наповнено!');
}

seed().catch((error) => {
  console.error(' Seed :', error);
  process.exit(1);
});
