import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";

export async function POST(request: NextRequest) {
	try {
		const { identifier } = await request.json();

		if (!identifier || typeof identifier !== "string") {
			return NextResponse.json(
				{ error: "Identifier is required" },
				{ status: 400 },
			);
		}

		// Check if it's an email
		if (identifier.includes("@")) {
			return NextResponse.json({ email: identifier });
		}

		// Look up email by username
		const userRecord = await db
			.select()
			.from(user)
			.where(eq(user.username, identifier.toLowerCase()))
			.limit(1);

		if (userRecord.length === 0) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({ email: userRecord[0].email });
	} catch (error) {
		console.error("Error looking up email:", error);
		return NextResponse.json(
			{ error: "Failed to look up email" },
			{ status: 500 },
		);
	}
}
