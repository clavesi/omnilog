import "dotenv/config";
import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// If in production, use the public URL, otherwise use the local URL
const url =
	process.env.NODE_ENV === "production"
		? process.env.URL_PUBLIC
		: process.env.URL_LOCAL;

export const authClient = createAuthClient({
	baseURL: url,
	plugins: [usernameClient()],
});
