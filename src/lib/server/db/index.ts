import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';
import * as schema from './schema';
import ws from 'ws';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

let connectionString = env.DATABASE_URL;

// Configure for local development
// if (env.NODE_ENV === 'development') {
// 	connectionString = 'postgres://postgres:postgres@db.localtest.me:5432/main';
// 	neonConfig.fetchEndpoint = (host) => {
// 		const [protocol, port] = host === 'db.localtest.me' ? ['http', 4444] : ['https', 443];
// 		return `${protocol}://${host}:${port}/sql`;
// 	};
// 	const connectionStringUrl = new URL(connectionString);
// 	neonConfig.useSecureWebSocket = connectionStringUrl.hostname !== 'db.localtest.me';
// 	neonConfig.wsProxy = (host) => (host === 'db.localtest.me' ? `${host}:4444/v2` : `${host}/v2`);
// }
// neonConfig.webSocketConstructor = ws;

const sql = neon(connectionString);
export const db = drizzle(sql, { schema: { ...schema } });
