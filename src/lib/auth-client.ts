import { createAuthClient } from 'better-auth/svelte';
import { PUBLIC_BETTER_AUTH_URL_PUBLIC, PUBLIC_BETTER_AUTH_URL_LOCAL } from '$env/static/public';

const BETTER_AUTH_URL = process.env.NODE_ENV === 'production' ? PUBLIC_BETTER_AUTH_URL_PUBLIC : PUBLIC_BETTER_AUTH_URL_LOCAL;

export const authClient = createAuthClient({
	baseURL: BETTER_AUTH_URL
});