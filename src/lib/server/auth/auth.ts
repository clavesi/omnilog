import {
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET
} from "$env/static/private";
import { dev } from "$app/environment";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { GitHub, Google } from "arctic";
import { Lucia } from "lucia";
import { db } from "$lib/db";
import { UserTable, SessionTable } from "../../db/schema";

const adapter = new DrizzlePostgreSQLAdapter(db, SessionTable, UserTable);

export const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET);

const baseUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: "http://localhost:5173";

const redirectUrl = `${baseUrl}/auth/callback/google`;
export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUrl);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// Set to true when using https
			secure: !dev
		}
	},
	getUserAttributes: (attributes) => {
		return {
			name: attributes.name,
			username: attributes.username,
			email: attributes.email
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			name: string;
			username: string;
			email: string;
		};
	}
}
