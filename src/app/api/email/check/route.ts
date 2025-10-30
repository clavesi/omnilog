import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";

export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json();

		if (!email || typeof email !== "string") {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json({ available: false, reason: "invalid" });
		}

		const normalizedEmail = email.toLowerCase().trim();
		const existingUser = await db
			.select()
			.from(user)
			.where(eq(user.email, normalizedEmail))
			.limit(1);

		return NextResponse.json({ available: existingUser.length === 0 });
	} catch (error) {
		console.error("Error checking email:", error);
		return NextResponse.json(
			{ error: "Failed to check email availability" },
			{ status: 500 },
		);
	}
}
