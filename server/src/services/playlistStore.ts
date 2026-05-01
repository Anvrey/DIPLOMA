
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Playlist } from '../types/index.js';

const DATA_DIR = path.join(import.meta.dirname, '..', 'data');
const PLAYLISTS_PATH = path.join(DATA_DIR, 'playlists.json');

let playlists: Playlist[] = [];

export function loadPlaylists(): void {
  if (fs.existsSync(PLAYLISTS_PATH)) {
    const data = fs.readFileSync(PLAYLISTS_PATH, 'utf-8');
    playlists = JSON.parse(data);
    console.log(`Loaded ${playlists.length} playlists`);
  } else {
    playlists = [];
  }
}

function savePlaylists(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(PLAYLISTS_PATH, JSON.stringify(playlists, null, 2), 'utf-8');
}

export function getUserPlaylists(userId: string): Playlist[] {
  return playlists.filter((p) => p.userId === userId);
}

export function getPlaylistById(id: string): Playlist | undefined {
  return playlists.find((p) => p.id === id);
}

export function createPlaylist(userId: string, name: string, trackIds: number[] = []): Playlist {
  const playlist: Playlist = {
    id: uuidv4(),
    userId,
    name,
    trackIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  playlists.push(playlist);
  savePlaylists();
  return playlist;
}

export function addTrackToPlaylist(playlistId: string, trackId: number): Playlist | null {
  const playlist = playlists.find((p) => p.id === playlistId);
  if (!playlist) return null;

  if (!playlist.trackIds.includes(trackId)) {
    playlist.trackIds.push(trackId);
    playlist.updatedAt = new Date().toISOString();
    savePlaylists();
  }

  return playlist;
}

export function removeTrackFromPlaylist(playlistId: string, trackId: number): Playlist | null {
  const playlist = playlists.find((p) => p.id === playlistId);
  if (!playlist) return null;

  playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
  playlist.updatedAt = new Date().toISOString();
  savePlaylists();

  return playlist;
}

export function deletePlaylist(playlistId: string, userId: string): boolean {
  const index = playlists.findIndex((p) => p.id === playlistId && p.userId === userId);
  if (index === -1) return false;

  playlists.splice(index, 1);
  savePlaylists();
  return true;
}

export function renamePlaylist(playlistId: string, name: string): Playlist | null {
  const playlist = playlists.find((p) => p.id === playlistId);
  if (!playlist) return null;

  playlist.name = name;
  playlist.updatedAt = new Date().toISOString();
  savePlaylists();

  return playlist;
}
