import { NextRequest, NextResponse } from "next/server";
import { isUsernameAvailable } from "@/lib/username";

export async function POST(request: NextRequest) {
	try {
		const { username } = await request.json();

		if (!username || typeof username !== "string") {
			return NextResponse.json(
				{ error: "Username is required" },
				{ status: 400 },
			);
		}

		const available = await isUsernameAvailable(username);

		return NextResponse.json({ available });
	} catch (error) {
		console.error("Error checking username:", error);
		return NextResponse.json(
			{ error: "Failed to check username availability" },
			{ status: 500 },
		);
	}
}
