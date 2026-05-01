



import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { User, UserPublic } from '../types/index.js';

const DATA_DIR = path.join(import.meta.dirname, '..', 'data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');

let users: User[] = [];

export function loadUsers(): void {
  if (fs.existsSync(USERS_PATH)) {
    const data = fs.readFileSync(USERS_PATH, 'utf-8');
    users = JSON.parse(data);
    console.log(`Loading ${users.length} users`);
  } else {
    users = [];
  }
}


function saveUsers(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
}


export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<UserPublic> {
  const existing = users.find((u) => u.email === email);
  if (existing) {
    throw new Error('   email  ');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user: User = {
    id: uuidv4(),
    email,
    name,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers();

  return toPublic(user);
}


export async function verifyUser(
  email: string,
  password: string
): Promise<UserPublic | null> {
  const user = users.find((u) => u.email === email);
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return null;

  return toPublic(user);
}


export function getUserById(id: string): UserPublic | null {
  const user = users.find((u) => u.id === id);
  return user ? toPublic(user) : null;
}


function toPublic(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}
