



export interface Track {
  id: number;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  mood?: string;
  tempo?: number;
  previewUrl?: string;
  albumCoverUrl?: string;
  deezerLink?: string;
}

export interface TrackWithScore extends Track {
  score: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  trackIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackEvent {
  id: string;
  trackId: number;
  userId: string;
  action: 'like' | 'dislike' | 'skip' | 'playlist_add' | 'play';
  listenDuration?: number;
  timestamp: string;
}

export interface SearchRequest {
  query: string;
  topK?: number;
}

export interface SearchResponse {
  tracks: TrackWithScore[];
  query: string;
}

export interface AuthRegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}
