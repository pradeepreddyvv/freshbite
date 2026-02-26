/**
 * Test setup — load .env and initialize Prisma for integration tests.
 */
import { config } from 'dotenv';

// Load .env for DATABASE_URL
config({ path: '.env' });
