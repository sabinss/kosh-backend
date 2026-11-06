import { config } from 'dotenv';

config();

const { PORT, NODE_ENV, DATABASE_URL, JWT_SECRET } = process.env;

export const Config = {
    PORT: PORT,
    NODE_ENV: NODE_ENV,
    DATABASE_URL: DATABASE_URL,
    JWT_SECRET: JWT_SECRET,
};
