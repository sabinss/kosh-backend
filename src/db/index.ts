import { drizzle } from 'drizzle-orm/node-postgres';
import { Config } from '../config';
// import { relations } from './relations';

if (!Config.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Add it to your .env file.');
}

// Single shared connection pool for the whole app. Import `db` from here.
// export const db = drizzle(Config.DATABASE_URL, { relations });
export const db = drizzle(Config.DATABASE_URL);

export type Database = typeof db;
