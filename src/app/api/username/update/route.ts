import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { isUsernameAvailable } from "@/lib/username";

export async function POST(request: NextRequest) {
	try {
		const session = await requireAuth();
		const { username } = await request.json();

		if (!username || typeof username !== "string") {
			return NextResponse.json(
				{ error: "Username is required" },
				{ status: 400 },
			);
		}

		const normalizedUsername = username.toLowerCase().trim();

		// Validate format
		if (!/^[a-z0-9_-]{3,20}$/i.test(normalizedUsername)) {
			return NextResponse.json(
				{
					error:
						"Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens",
				},
				{ status: 400 },
			);
		}

		// Check availability
		const available = await isUsernameAvailable(normalizedUsername);
		if (!available) {
			return NextResponse.json(
				{ error: "Username is already taken" },
				{ status: 400 },
			);
		}

		// Update username
		await db
			.update(user)
			.set({ username: normalizedUsername })
			.where(eq(user.id, session.user.id));

		return NextResponse.json({
			success: true,
			username: normalizedUsername,
		});
	} catch (error) {
		if (error instanceof Error && error.message === "redirect") {
			// This is the redirect from requireAuth, re-throw it
			throw error;
		}
		console.error("Error updating username:", error);
		return NextResponse.json(
			{ error: "Failed to update username" },
			{ status: 500 },
		);
	}
}
