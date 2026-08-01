import { hash, verify } from "@node-rs/argon2";
import { error, type RequestEvent, redirect } from "@sveltejs/kit";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import {
	BETTER_AUTH_SECRET,
	BETTER_AUTH_URL,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
} from "$env/static/private";
import { db } from "./db";
import { account, session, users, verification } from "./db/schema";
import { sendPasswordResetEmail, sendVerificationEmail } from "./resend";
import { safeRelativePath } from "./safe-path";

const ARGON2_PARAMS = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };

export const auth = betterAuth({
	secret: BETTER_AUTH_SECRET,
	baseURL: BETTER_AUTH_URL,
	rateLimit: { enabled: true },
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
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			await sendVerificationEmail(user.email, url);
		},
		sendOnSignUp: true,
	},
	socialProviders: {
		github: { clientId: GITHUB_CLIENT_ID, clientSecret: GITHUB_CLIENT_SECRET },
		google: { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET },
	},
	account: {
		accountLinking: {
			enabled: true,
			// Both providers verify emails before handing them back to us, so
			// auto-linking on a matching verified email is safe here.
			trustedProviders: ["github", "google"],
		},
	},
	user: {
		deleteUser: { enabled: true },
		additionalFields: {
			bio: { type: "string", required: false, input: false, fieldName: "bio" },
			role: { type: "string", required: false, input: false, defaultValue: "user", fieldName: "role" },
			usernameConfirmed: {
				type: "boolean",
				required: false,
				input: false,
				defaultValue: true,
				fieldName: "usernameConfirmed",
			},
			isPrivate: {
				type: "boolean",
				required: false,
				input: false,
				defaultValue: false,
				fieldName: "isPrivate",
			},
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user, context) => {
					// Only OAuth-created accounts land here without a real username.
					// Email/password signup always supplies one via the username plugin already.
					// The OAuth callback route is /callback/:id.
					if (!context?.path?.startsWith("/callback/")) return;

					const placeholder = derivePlaceholderUsername(user.email);
					return {
						data: {
							...user,
							username: placeholder,
							displayUsername: placeholder,
							usernameConfirmed: false,
						},
					};
				},
			},
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

/**
 * Create a placeholder username until user creates custom username.
 */
function derivePlaceholderUsername(email: string): string {
	const base =
		email
			.split("@")[0]
			.toLowerCase()
			.replace(/[^a-z0-9_]/g, "")
			.slice(0, 20) || "user";
	const suffix = Math.random().toString(36).slice(2, 6);
	return `${base}_${suffix}`;
}

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
