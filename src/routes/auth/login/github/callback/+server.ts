import { github, lucia } from "$lib/server/auth/auth";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import type { RequestEvent } from "@sveltejs/kit";
import { db } from "$lib/db";
import { UserTable } from "$lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get("code");
	const state = event.url.searchParams.get("state");
	const storedState = event.cookies.get("github_oauth_state") ?? null;

	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens = await github.validateAuthorizationCode(code);

		const githubUserResponse = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});

		const githubUser: GitHubUser = await githubUserResponse.json();

		// Replace this with your own DB client.
		const existingUser = await db.query.UserTable.findFirst({
			where: and(eq(UserTable.provider, "github"), eq(UserTable.providerId, githubUser.id))
		});

		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: ".",
				...sessionCookie.attributes
			});
		} else {
			const githubEmailResponse = await fetch("https://api.github.com/user/emails", {
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`
				}
			});

			const githubEmails: GitHubEmail[] = await githubEmailResponse.json();
			const primary = githubEmails.find((email) => email.primary);

			if (primary) {
				const userId = generateIdFromEntropySize(10);
				await db.insert(UserTable).values({
					id: userId,
					provider: "github",
					providerId: githubUser.id,
					displayName: githubUser.name,
					username: githubUser.login,
					email: primary.email,
					imageUrl: githubUser.avatar_url
				});

				const session = await lucia.createSession(userId, {});
				const sessionCookie = lucia.createSessionCookie(session.id);
				event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: ".",
					...sessionCookie.attributes
				});
			}
		}
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	} catch (e) {
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
}

interface GitHubUser {
	id: number;
	login: string;
	name: string;
	avatar_url: string;
}

type GitHubEmail = {
	email: string;
	primary: boolean;
	verified: boolean;
	visibility: string | null;
};
