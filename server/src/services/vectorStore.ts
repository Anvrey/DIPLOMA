

import hnsw from 'hnswlib-node';
const { HierarchicalNSW } = hnsw;

import path from 'path';
import fs from 'fs';
import { EMBEDDING_DIMENSIONS } from './embedding.js';

const DATA_DIR = path.join(import.meta.dirname, '..', 'data');
const INDEX_PATH = path.join(DATA_DIR, 'vectors.hnsw');

let index: InstanceType<typeof HierarchicalNSW> | null = null;
let maxElements = 2000;


export function initIndex(maxEl: number = 2000): void {
  maxElements = maxEl;
  index = new HierarchicalNSW('cosine', EMBEDDING_DIMENSIONS);

  if (fs.existsSync(INDEX_PATH)) {
    try {
      index.readIndexSync(INDEX_PATH);
      console.log(`Loaded index: ${index.getCurrentCount()} vectors`);
    } catch {
      console.warn('Error reading index, creating new one');
      index.initIndex(maxElements);
    }
  } else {
    index.initIndex(maxElements);
    console.log(`Created new index (max: ${maxElements})`);
  }
}


export function addVector(id: number, vector: number[]): void {
  if (!index) initIndex();
  if (!index) return;

  const count = index.getCurrentCount();
  if (count >= maxElements) {
    const newMax = maxElements * 2;
    index.resizeIndex(newMax);
    maxElements = newMax;
    console.log(`Index resized to ${newMax}`);
  }
  index.addPoint(vector, id);
}


export function search(queryVector: number[], topK: number = 10) {
  if (!index) initIndex();
  if (!index) return [];
  const count = index.getCurrentCount();
  if (count === 0) return [];
  const k = Math.min(topK, count);
  const result = index.searchKnn(queryVector, k);
  return result.neighbors.map((id: number, i: number) => ({
    id,
    distance: result.distances[i],
  }));
}


export function saveIndex(): void {
  if (!index) return;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  index.writeIndexSync(INDEX_PATH);
}
