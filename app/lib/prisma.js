import pkg from 'pg';
const { Pool } = pkg;

let db;

export function getDB() {
  if (!db) {
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return db;
}

// Helper function to execute queries
export async function query(text, params) {
  const client = getDB();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function to get a single row
export async function queryRow(text, params) {
  const result = await query(text, params);
  return result.rows[0];
}

// Helper function to get all rows
export async function queryRows(text, params) {
  const result = await query(text, params);
  return result.rows;
}

// Export db for backward compatibility
export const prisma = {
  // We'll add specific query methods here as needed
};