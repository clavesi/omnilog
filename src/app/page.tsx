import { eq } from "drizzle-orm";
import { LoggedInHomepage } from "@/components/logged-in-homepage";
import { PublicLandingPage } from "@/components/public-landing-page";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { getSession } from "@/lib/session";

export default async function Home() {
	const session = await getSession();

	// Show logged-in homepage if authenticated
	if (session) {
		const existingUser = await db
			.select()
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		const userUsername = existingUser[0]?.username || session.user.email;

		return <LoggedInHomepage username={userUsername} />;
	}

	// Show public landing page if not authenticated
	return <PublicLandingPage />;
}
