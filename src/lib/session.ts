import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Get the current session from the server side.
 * This function can be used in Server Components, Server Actions, and Route Handlers.
 *
 * @returns {Promise<Session | null>} The current session or null if not authenticated
 */
export async function getSession() {
	return await auth.api.getSession({
		headers: await headers(),
	});
}

/**
 * Require authentication - redirects to login page if user is not logged in.
 * Use this in Server Actions or API routes that require authentication.
 *
 * @redirects {/login} If user is not authenticated
 */
export async function requireAuth() {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	return session;
}
