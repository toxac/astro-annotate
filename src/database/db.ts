import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.resolve('./annotations.db');

export async function openDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}

export async function initDb() {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      userId TEXT,
      highlightId TEXT,
      text TEXT,
      comment TEXT,
      pageUrl TEXT,
      timestamp TEXT
    )
  `);
  await db.close();
}