import { env } from '$env/dynamic/private';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle as drizzleWs } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import ws from 'ws';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const connectionString = env.DATABASE_URL;
if (process.env.NODE_ENV === 'development') {
	const connectionStringUrl = new URL(connectionString);
	neonConfig.useSecureWebSocket = connectionStringUrl.hostname !== 'db.localtest.me';
	neonConfig.wsProxy = (host) => (host === 'db.localtest.me' ? `${host}:4444/v2` : `${host}/v2`);
}
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString });
export const db = drizzleWs(pool, { schema });
