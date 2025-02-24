import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';
import * as schema from './schema';
import ws, { WebSocket } from 'ws';

// set default option for all clients
neonConfig.webSocketConstructor = ws;
const connectionString =
    process.env.NODE_ENV === 'production' ? env.DATABASE_URL : env.LOCAL_POSTGRES_URL;

if (process.env.NODE_ENV === 'production') {
    neonConfig.webSocketConstructor = WebSocket;
    neonConfig.poolQueryViaFetch = true;
} else {
    neonConfig.wsProxy = (host) => `${host}:5433/v1`;
    neonConfig.useSecureWebSocket = false;
    neonConfig.pipelineTLS = false;
    neonConfig.pipelineConnect = false;
}

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });
export default db;
// const sql = neon(connectionString);
// export const db = drizzleHttp({ client: sql, schema: { ...schema } });