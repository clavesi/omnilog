/**
 * Error type for failures returned *by* an external API.
 *
 * Currently only Tenrai constructs these.
 */
export class UpstreamApiError extends Error {
	readonly source: string;
	readonly status: number;
	/** The provider's own explanation, when it sent one. */
	readonly upstreamMessage: string | null;

	constructor(params: { source: string; status: number; upstreamMessage: string | null; message: string }) {
		super(params.message);
		this.name = "UpstreamApiError";
		this.source = params.source;
		this.status = params.status;
		this.upstreamMessage = params.upstreamMessage;
	}
}

/**
 * Pull a displayable message out of an error, or null if there isn't one
 * worth showing. Used by the search route to decide between the provider's
 * explanation and a generic fallback.
 */
export function upstreamMessageOf(err: unknown): string | null {
	return err instanceof UpstreamApiError ? err.upstreamMessage : null;
}

/**
 * Read a provider's error body without letting a malformed one mask the
 * original failure.
 *
 * Jikan/Tenrai, returns
 * `{ status, type, message, error }`.
 * Which of `message`/`error` carries the useful text varies by failure mode, so try both.
 *
 * Safe to call only on a response you've already decided is an error, since it consumes the body.
 */
export async function readUpstreamMessage(res: Response): Promise<string | null> {
	try {
		const body = (await res.json()) as { message?: unknown; error?: unknown };
		for (const candidate of [body?.message, body?.error]) {
			if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
		}
	} catch {
		// Non-JSON or empty body — nothing to surface, fall through.
	}
	return null;
}
