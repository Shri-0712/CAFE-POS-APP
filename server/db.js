import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Open or create database
export async function openDB() {
  return open({
    filename: './server/orders.db',
    driver: sqlite3.Database
  });
}

// Initialize orders table
export async function initDB() {
  const db = await openDB();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT,
      items TEXT
    )
  `);
  return db;
}