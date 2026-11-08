import { config } from 'dotenv';

config();

const {
    PORT,
    NODE_ENV,
    DATABASE_URL,
    JWT_SECRET,
    SYSTEM_ADMIN_NAME,
    SYSTEM_ADMIN_EMAIL,
    SYSTEM_ADMIN_PASSWORD,
} = process.env;

export const Config = {
    PORT: PORT,
    NODE_ENV: NODE_ENV,
    DATABASE_URL: DATABASE_URL,
    JWT_SECRET: JWT_SECRET,
    // Only used by `npm run db:seed`
    SYSTEM_ADMIN_NAME: SYSTEM_ADMIN_NAME,
    SYSTEM_ADMIN_EMAIL: SYSTEM_ADMIN_EMAIL,
    SYSTEM_ADMIN_PASSWORD: SYSTEM_ADMIN_PASSWORD,
};
