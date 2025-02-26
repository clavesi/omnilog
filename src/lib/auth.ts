import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import db from '$lib/server/db';
import { BETTER_AUTH_URL_PUBLIC, BETTER_AUTH_URL_LOCAL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, BETTER_AUTH_SECRET } from '$env/static/private';

const BETTER_AUTH_URL = process.env.NODE_ENV == 'production' ? BETTER_AUTH_URL_PUBLIC : BETTER_AUTH_URL_LOCAL;

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	secret: BETTER_AUTH_SECRET,
	baseURL: BETTER_AUTH_URL,
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
