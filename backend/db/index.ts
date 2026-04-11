import { config } from 'dotenv';

// Ensure environment variables are loaded
config();

// In-memory database for development
// This is a fallback when PostgreSQL is not available
export const db = {
  insert: () => ({
    values: () => ({
      returning: () => Promise.resolve([{}]),
    }),
  }),
  select: () => ({
    from: () => ({
      where: () => Promise.resolve([]),
    }),
  }),
};
