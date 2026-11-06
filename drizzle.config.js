import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'postgresql',
    // Barrel file: every table exported from src/db/schema/index.ts is managed
    schema: './src/db/schema/index.ts',
    // Generated SQL migrations are committed here
    out: './drizzle',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
