

import fs from 'fs';
import path from 'path';
import type { Track } from '../types/index.js';

const DATA_DIR = path.join(import.meta.dirname, '..', 'data');
const TRACKS_PATH = path.join(DATA_DIR, 'tracks.json');

let tracks: Track[] = [];


export function loadTracks(): Track[] {
  if (fs.existsSync(TRACKS_PATH)) {
    const data = fs.readFileSync(TRACKS_PATH, 'utf-8');
    tracks = JSON.parse(data);
    console.log(`Loaded ${tracks.length} tracks`);
  } else {
    tracks = [];
    console.log('Tracks file not found, starting fresh');
  }
  return tracks;
}


export function saveTracks(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(TRACKS_PATH, JSON.stringify(tracks, null, 2), 'utf-8');
}


export function getAllTracks(): Track[] {
  return tracks;
}


export function getTrackById(id: number): Track | undefined {
  return tracks.find((t) => t.id === id);
}


export function getTracksByIds(ids: number[]): Track[] {
  return ids
    .map((id) => tracks.find((t) => t.id === id))
    .filter((t): t is Track => t !== undefined);
}


export function addTrack(track: Track): Track {
  tracks.push(track);
  return track;
}


export function addTracks(newTracks: Track[]): void {
  tracks.push(...newTracks);
}


export function getNextId(): number {
  if (tracks.length === 0) return 1;
  return Math.max(...tracks.map((t) => t.id)) + 1;
}


export function getTrackCount(): number {
  return tracks.length;
}


export function getTracksPaginated(page: number = 1, limit: number = 20): { tracks: Track[]; total: number; page: number; totalPages: number } {
  const total = tracks.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  // Clone and reverse to show newest tracks first
  const reversedTracks = [...tracks].reverse();

  return {
    tracks: reversedTracks.slice(start, end),
    total,
    page,
    totalPages,
  };
}
