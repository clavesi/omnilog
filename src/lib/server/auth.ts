import { hash, verify } from "@node-rs/argon2";
import { error, type RequestEvent, redirect } from "@sveltejs/kit";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from "$env/static/private";
import { db } from "./db";
import { account, session, users, verification } from "./db/schema";
import { sendPasswordResetEmail } from "./resend";
import { safeRelativePath } from "./safe-path";

const ARGON2_PARAMS = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };

export const auth = betterAuth({
	secret: BETTER_AUTH_SECRET,
	baseURL: BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: { user: users, session, account, verification },
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		password: {
			hash: (password) => hash(password, ARGON2_PARAMS),
			verify: ({ hash: storedHash, password }) => verify(storedHash, password, ARGON2_PARAMS),
		},
		sendResetPassword: async ({ user, url }) => {
			await sendPasswordResetEmail(user.email, url);
		},
		revokeSessionsOnPasswordReset: true,
	},
	user: {
		additionalFields: {
			avatarUrl: { type: "string", required: false, input: false, fieldName: "avatarUrl" },
			bio: { type: "string", required: false, input: false, fieldName: "bio" },
			role: { type: "string", required: false, input: false, defaultValue: "user", fieldName: "role" },
		},
		deleteUser: {
			enabled: true,
		},
	},
	plugins: [
		username({ minUsernameLength: 3, maxUsernameLength: 30 }),
		// Must be last — handles setting cookies correctly when auth
		// methods (signInEmail, signUpEmail, etc.) are called from
		// SvelteKit server actions rather than through the HTTP handler.
		sveltekitCookies(getRequestEvent),
	],
});

// --- App middleware ---
export function requireUser(event: RequestEvent) {
	if (!event.locals.user) {
		const next = safeRelativePath(`${event.url.pathname}${event.url.search}`);
		redirect(302, `/login?next=${encodeURIComponent(next)}`);
	}
	return event.locals.user;
}

export function requireAdmin(event: RequestEvent) {
	const user = requireUser(event);
	if (user.role !== "admin" && user.role !== "owner") {
		error(403, "Admins only");
	}
	return user;
}

export function requireOwner(event: RequestEvent) {
	const user = requireUser(event);
	if (user.role !== "owner") {
		error(403, "Owner only");
	}
	return user;
}
