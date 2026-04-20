import type { RequestEvent } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { sessions, users } from "./db/schema";

const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;

const INACTIVITY_TIMEOUT_MS = 30 * DAY_IN_MS; // sign out after 30 days of inactivity
const ACTIVITY_CHECK_INTERVAL_MS = 1 * HOUR_IN_MS; // update lastVerifiedAt at most once per hour

export const sessionCookieName = "auth-session";

// --- Token generation ---

function generateSecureRandomString(): string {
    const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    let id = "";
    for (let i = 0; i < bytes.length; i++) {
        id += alphabet[bytes[i] >> 3];
    }
    return id;
}

async function hashSecret(secret: string): Promise<Uint8Array> {
    const secretBytes = new TextEncoder().encode(secret);
    const hashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
    return new Uint8Array(hashBuffer);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.byteLength !== b.byteLength) return false;
    let c = 0;
    for (let i = 0; i < a.byteLength; i++) {
        c |= a[i] ^ b[i];
    }
    return c === 0;
}

// --- Types ---

export type SessionWithToken = {
    id: string;
    userId: string;
    createdAt: Date;
    lastVerifiedAt: Date;
    token: string;
};

// --- Session lifecycle ---

export async function createSession(userId: string): Promise<SessionWithToken> {
    const id = generateSecureRandomString();
    const secret = generateSecureRandomString();
    const secretHash = await hashSecret(secret);
    const now = new Date();

    await db.insert(sessions).values({
        id,
        userId,
        secretHash,
        createdAt: now,
        lastVerifiedAt: now,
    });

    return {
        id,
        userId,
        createdAt: now,
        lastVerifiedAt: now,
        token: `${id}.${secret}`,
    };
}

/**
 * Loads a session + user by session ID and enforces the inactivity timeout.
 * Does NOT verify the secret — that's validateSessionToken's job.
 */
async function getSessionAndUser(sessionId: string) {
    const [row] = await db
        .select({ session: sessions, user: users })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.id, sessionId));

    if (!row) return null;

    const { session, user } = row;

    // Inactivity check — based on lastVerifiedAt, not createdAt.
    const idleMs = Date.now() - session.lastVerifiedAt.getTime();
    if (idleMs >= INACTIVITY_TIMEOUT_MS) {
        await db.delete(sessions).where(eq(sessions.id, session.id));
        return null;
    }

    return { session, user };
}

export async function validateSessionToken(token: string) {
    const parts = token.split(".");
    if (parts.length !== 2) return { session: null, user: null };
    const [sessionId, secret] = parts;

    const result = await getSessionAndUser(sessionId);
    if (!result) return { session: null, user: null };

    const providedHash = await hashSecret(secret);
    if (!constantTimeEqual(providedHash, result.session.secretHash)) {
        return { session: null, user: null };
    }

    // Secret verified. Update activity marker if we're past the throttle window.
    const now = new Date();
    if (
        now.getTime() - result.session.lastVerifiedAt.getTime() >=
        ACTIVITY_CHECK_INTERVAL_MS
    ) {
        result.session.lastVerifiedAt = now;
        await db
            .update(sessions)
            .set({ lastVerifiedAt: now })
            .where(eq(sessions.id, result.session.id));
    }

    return result;
}

export async function invalidateSession(sessionId: string) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
}

// --- Cookie helpers ---

export function setSessionTokenCookie(event: RequestEvent, token: string) {
    event.cookies.set(sessionCookieName, token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: !import.meta.env.DEV,
        maxAge: Math.floor(INACTIVITY_TIMEOUT_MS / 1000),
    });
}

export function deleteSessionTokenCookie(event: RequestEvent) {
    event.cookies.delete(sessionCookieName, { path: "/" });
}

// --- Public serialization (omits secretHash) ---

export function encodeSessionPublicJSON(session: {
    id: string;
    createdAt: Date;
    lastVerifiedAt: Date;
}) {
    return {
        id: session.id,
        createdAt: Math.floor(session.createdAt.getTime() / 1000),
        lastVerifiedAt: Math.floor(session.lastVerifiedAt.getTime() / 1000),
    };
}

// --- App middleware ---
export function requireUser(event: RequestEvent) {
    if (!event.locals.user) {
        redirect(302, "/login");
    }
    return event.locals.user;
}
