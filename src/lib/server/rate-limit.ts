/**
 * Sequential request throttle used by Tenrai and MusicBrainz clients.
 *
 * Each API has its own rate limit, so createThrottle() returns an isolated
 * { throttled, abortableDelay } pair with its own state — callers don't share
 * a queue with each other.
 */

/** setTimeout that rejects early if the signal aborts while waiting. */
export function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
			return;
		}
		const timer = setTimeout(resolve, ms);
		signal?.addEventListener(
			"abort",
			() => {
				clearTimeout(timer);
				reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
			},
			{ once: true },
		);
	});
}

export type Throttle = <T>(fn: () => Promise<T>, signal?: AbortSignal) => Promise<T>;

/**
 * Returns a throttle function that spaces requests at least minGapMs apart.
 * Requests are queued sequentially rather than fired concurrently so rapid
 * callers can't pile up and trip the remote rate limit.
 *
 * The chain is kept alive even when individual calls error, so a failed
 * request doesn't stall the queue for subsequent ones.
 */
export function createThrottle(minGapMs: number): Throttle {
	let lastRequestAt = 0;
	let chain: Promise<void> = Promise.resolve();

	return function throttled<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
		const run = chain.then(async () => {
			const wait = Math.max(0, lastRequestAt + minGapMs - Date.now());
			if (wait > 0) await abortableDelay(wait, signal);
			lastRequestAt = Date.now();
		});
		chain = run.catch(() => {}); // keep the chain alive even if one call errors
		return run.then(fn);
	};
}
