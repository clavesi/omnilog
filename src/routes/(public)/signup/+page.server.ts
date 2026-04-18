import { hash } from "@node-rs/argon2";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { createSession, setSessionTokenCookie } from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";

// If already logged in, bounce them to the app.
export const load: PageServerLoad = (event) => {
    if (event.locals.user) {
        redirect(302, "/feed");
    }
};

export const actions: Actions = {
    default: async (event) => {
        const formData = await event.request.formData();
        const email = formData.get("email");
        const username = formData.get("username");
        const password = formData.get("password");

        // Keep email/username on failure so the form doesn't blank out
        const formValues = {
            email: typeof email === "string" ? email : "",
            username: typeof username === "string" ? username : "",
        };

        if (
            typeof email !== "string" ||
            !email.includes("@") ||
            email.length > 255
        ) {
            return fail(400, { ...formValues, message: "Invalid email" });
        }
        if (
            typeof username !== "string" ||
            username.length < 3 ||
            username.length > 31
        ) {
            return fail(400, {
                ...formValues,
                message: "Username must be 3-31 characters",
            });
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return fail(400, {
                ...formValues,
                message:
                    "Username can only contain letters, numbers, and underscores",
            });
        }
        if (
            typeof password !== "string" ||
            password.length < 8 ||
            password.length > 255
        ) {
            return fail(400, {
                ...formValues,
                message: "Password must be at least 8 characters",
            });
        }

        const existingEmail = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email));
        if (existingEmail.length > 0) {
            return fail(400, {
                ...formValues,
                message: "An account with that email already exists",
            });
        }

        const existingUsername = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.username, username));
        if (existingUsername.length > 0) {
            return fail(400, {
                ...formValues,
                message: "That username is taken",
            });
        }

        const passwordHash = await hash(password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1,
        });

        const [user] = await db
            .insert(users)
            .values({ email, username, passwordHash })
            .returning();

        const session = await createSession(user.id);
        setSessionTokenCookie(event, session.token);

        redirect(303, "/feed");
    },
};
