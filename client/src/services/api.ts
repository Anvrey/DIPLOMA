

import type {
  AuthResponse,
  SearchResponse,
  Track,
  Playlist,
  FeedbackEvent,
  PaginatedTracks,
} from '../types';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : 'https://diploma-5h0l.onrender.com/api';


async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    const errMsg = error.error || `HTTP ${response.status}`;
    const err = new Error(errMsg);
    (err as any).status = response.status;
    throw err;
  }

  return response.json();
}



export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<{ user: AuthResponse['user'] }> {
  return apiFetch('/auth/me');
}



export async function searchTracks(
  query: string,
  topK: number = 20,
  diversity: number = 0
): Promise<SearchResponse> {
  return apiFetch<SearchResponse>('/search', {
    method: 'POST',
    body: JSON.stringify({ query, topK, diversity }),
  });
}

export async function getSearchVibe(
  query: string
): Promise<{ vibe: { mood: string; emoji: string; gradientFrom: string; gradientTo: string; accent: string } }> {
  return apiFetch('/search/vibe', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function explainTrackMatch(
  query: string,
  track: { id: number; title: string; artist: string; genre?: string | null; mood?: string | null }
): Promise<{ explanation: string }> {
  return apiFetch('/search/explain', {
    method: 'POST',
    body: JSON.stringify({ query, track }),
  });
}

export async function curatePlaylist(
  scenario: string
): Promise<{
  plan: { name: string; description: string };
  segments: { label: string; tracks: import('./types').Track[] }[];
  playlist: import('./types').Playlist | null;
}> {
  return apiFetch('/playlists/curate', {
    method: 'POST',
    body: JSON.stringify({ scenario }),
  });
}



export async function getTracks(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedTracks> {
  return apiFetch<PaginatedTracks>(`/tracks?page=${page}&limit=${limit}`);
}

export async function getTrackById(id: number): Promise<Track> {
  return apiFetch<Track>(`/tracks/${id}`);
}

export async function uploadTrack(formData: FormData): Promise<Track> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/tracks/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}



export async function getPlaylists(): Promise<{ playlists: Playlist[] }> {
  return apiFetch('/playlists');
}

export async function getPlaylist(id: string): Promise<Playlist> {
  return apiFetch<Playlist>(`/playlists/${id}`);
}

export async function createPlaylist(name: string): Promise<Playlist> {
  return apiFetch<Playlist>('/playlists', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createAIPlaylist(name: string, query: string): Promise<Playlist> {
  return apiFetch<Playlist>('/playlists/ai', {
    method: 'POST',
    body: JSON.stringify({ name, query }),
  });
}

export async function addTrackToPlaylist(
  playlistId: string,
  trackId: number
): Promise<Playlist> {
  return apiFetch<Playlist>(`/playlists/${playlistId}`, {
    method: 'PUT',
    body: JSON.stringify({ addTrackId: trackId }),
  });
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: number
): Promise<Playlist> {
  return apiFetch<Playlist>(`/playlists/${playlistId}`, {
    method: 'PUT',
    body: JSON.stringify({ removeTrackId: trackId }),
  });
}

export async function deletePlaylist(id: string): Promise<void> {
  await apiFetch(`/playlists/${id}`, { method: 'DELETE' });
}



export async function sendFeedback(
  trackId: number,
  action: FeedbackEvent['action'],
  listenDuration?: number
): Promise<FeedbackEvent> {
  return apiFetch<FeedbackEvent>('/feedback', {
    method: 'POST',
    body: JSON.stringify({ trackId, action, listenDuration }),
  });
}
