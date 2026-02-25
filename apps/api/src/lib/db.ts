import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema/tasks.js';

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/whats_next_api';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
