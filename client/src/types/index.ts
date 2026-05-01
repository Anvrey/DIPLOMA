



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
  tracks?: Track[];
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

export interface SearchResponse {
  tracks: TrackWithScore[];
  query: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

export interface PaginatedTracks {
  tracks: Track[];
  total: number;
  page: number;
  totalPages: number;
}
