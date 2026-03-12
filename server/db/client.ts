import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../env';
import * as schema from './schema';

export const db = drizzle(env.databaseUrl, { schema });
