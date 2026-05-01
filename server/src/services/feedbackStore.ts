



import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { FeedbackEvent } from '../types/index.js';

const DATA_DIR = path.join(import.meta.dirname, '..', 'data');
const FEEDBACK_PATH = path.join(DATA_DIR, 'feedback.json');

let feedbackEvents: FeedbackEvent[] = [];


export function loadFeedback(): void {
  if (fs.existsSync(FEEDBACK_PATH)) {
    const data = fs.readFileSync(FEEDBACK_PATH, 'utf-8');
    feedbackEvents = JSON.parse(data);
    console.log(`Loading ${feedbackEvents.length} feedback events`);
  } else {
    feedbackEvents = [];
  }
}


function saveFeedback(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(FEEDBACK_PATH, JSON.stringify(feedbackEvents, null, 2), 'utf-8');
}


export function addFeedbackEvent(
  trackId: number,
  userId: string,
  action: FeedbackEvent['action'],
  listenDuration?: number
): FeedbackEvent {
  const event: FeedbackEvent = {
    id: uuidv4(),
    trackId,
    userId,
    action,
    listenDuration,
    timestamp: new Date().toISOString(),
  };

  feedbackEvents.push(event);
  saveFeedback();
  return event;
}


export function getFeedbackScores(trackIds: number[], userId?: string): Map<number, number> {
  const scores = new Map<number, number>();
  const trackIdSet = new Set(trackIds);

  const weights: Record<FeedbackEvent['action'], number> = {
    like: 1.0,
    play: 0.3,
    playlist_add: 0.5,
    dislike: -1.0,
    skip: -0.3,
  };

  for (const event of feedbackEvents) {
    if (!trackIdSet.has(event.trackId)) continue;
    if (userId && event.userId !== userId) continue;

    const currentScore = scores.get(event.trackId) || 0;
    scores.set(event.trackId, currentScore + weights[event.action]);
  }

  return scores;
}


export function getUserFeedbackForTracks(
  userId: string,
  trackIds: number[]
): Map<number, FeedbackEvent['action'][]> {
  const result = new Map<number, FeedbackEvent['action'][]>();
  const trackIdSet = new Set(trackIds);

  for (const event of feedbackEvents) {
    if (event.userId !== userId || !trackIdSet.has(event.trackId)) continue;

    const actions = result.get(event.trackId) || [];
    actions.push(event.action);
    result.set(event.trackId, actions);
  }

  return result;
}
