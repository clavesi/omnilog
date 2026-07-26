import { error, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";
import { safeRelativePath } from "$lib/server/safe-path";
import type { RequestHandler } from "./$types";

const VALID_PROVIDERS = new Set(["github", "google"]);

export const GET: RequestHandler = async (event) => {
	const { provider } = event.params;
	if (!provider || !VALID_PROVIDERS.has(provider)) {
		throw error(404, "Unknown provider");
	}

	const next = safeRelativePath(event.url.searchParams.get("next"));

	const result = await auth.api.signInSocial({
		body: {
			provider: provider as "github" | "google",
			callbackURL: next,
		},
		headers: event.request.headers,
	});

	if (!result?.url) {
		throw error(500, "Could not start sign-in with that provider");
	}

	redirect(302, result.url);
};
