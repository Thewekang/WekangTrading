import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './db/schema';

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle> | undefined;
};

const isProduction = process.env.NODE_ENV === 'production';

// Validate required environment variables
if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL environment variable is required');
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN environment variable is required');
}

// Create LibSQL client for Turso
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create Drizzle ORM instance with schema
// Note: Logger disabled to reduce console noise. 
// Drizzle's default logger prefixes queries with "Query:" which can be confusing.
// Enable only for debugging: logger: true
export const db = globalForDb.db ?? drizzle(client, { 
  schema,
  logger: false, // Disabled - was showing "Failed query" for normal empty results
});

if (!isProduction) globalForDb.db = db;

// Export schema for direct access
export { schema };
