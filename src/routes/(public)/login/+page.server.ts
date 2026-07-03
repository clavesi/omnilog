import { verify } from "@node-rs/argon2";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { createSession, setSessionTokenCookie } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

// Only allow redirecting to a same-site relative path
function safeNextPath(raw: string | null): string {
	if (!raw) return "/feed";
	if (!raw.startsWith("/") || raw.startsWith("//")) return "/feed";
	return raw;
}

export const load: PageServerLoad = (event) => {
	const next = safeNextPath(event.url.searchParams.get("next"));
	if (event.locals.user) {
		redirect(302, next);
	}
	return { next };
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get("email");
		const password = formData.get("password");
		const nextRaw = formData.get("next");
		const next = safeNextPath(typeof nextRaw === "string" ? nextRaw : null);

		const formValues = {
			email: typeof email === "string" ? email : "",
		};

		if (typeof email !== "string" || typeof password !== "string") {
			return fail(400, {
				...formValues,
				message: "Email and password are required",
			});
		}

		const [user] = await db.select().from(users).where(eq(users.email, email));
		if (!user) {
			return fail(400, {
				...formValues,
				message: "Incorrect email or password",
			});
		}

		const validPassword = await verify(user.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		});
		if (!validPassword) {
			return fail(400, {
				...formValues,
				message: "Incorrect email or password",
			});
		}

		const session = await createSession(user.id);
		setSessionTokenCookie(event, session.token);

		redirect(303, next);
	},
};
