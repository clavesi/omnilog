import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Get the current session from the server side.
 * This function can be used in Server Components, Server Actions, and Route Handlers.
 *
 * @example
 * ```tsx
 * import { getSession } from "@/lib/session";
 *
 * export default async function MyPage() {
 *   const session = await getSession();
 *
 *   if (!session) {
 *     return <div>Not logged in</div>;
 *   }
 *
 *   return <div>Welcome {session.user.email}</div>;
 * }
 * ```
 */
export async function getSession() {
	return await auth.api.getSession({
		headers: await headers(),
	});
}

/**
 * Require authentication - throws an error if user is not logged in.
 * Use this in Server Actions or API routes that require authentication.
 *
 * @throws {Error} If user is not authenticated
 *
 * @example
 * ```tsx
 * import { requireAuth } from "@/lib/session";
 *
 * export async function myServerAction() {
 *   const session = await requireAuth();
 *   // session is guaranteed to exist here
 *   console.log(session.user.email);
 * }
 * ```
 */
export async function requireAuth() {
	const session = await getSession();

	if (!session) {
		throw new Error("Unauthorized - Please sign in");
	}

	return session;
}
