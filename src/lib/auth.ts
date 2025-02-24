import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import db from '$lib/server/db';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	emailAndPassword: {
		enabled: false
	},
	socialProviders: {
		github: {
			clientId: GITHUB_CLIENT_ID!,
			clientSecret: GITHUB_CLIENT_SECRET!
		}
	}
});

export type User = typeof auth;
