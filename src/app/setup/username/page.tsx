import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UsernameSetupForm } from "@/components/auth/username-setup-form";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
	title: "Choose Your Username",
	description: "Set up your username",
};

export default async function UsernameSetupPage() {
	const session = await getSession();

	// Redirect to login if not authenticated
	if (!session) {
		redirect("/login");
	}

	// Check if user already has a username (not temporary)
	const existingUser = await db
		.select()
		.from(user)
		.where(eq(user.id, session.user.id))
		.limit(1);

	if (existingUser.length > 0 && existingUser[0].username) {
		// User already has a username, redirect to homepage
		redirect("/");
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">
						Choose Your Username
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Pick a unique username for your profile. You can change this later
						in settings.
					</p>
				</div>

				<UsernameSetupForm />
			</div>
		</div>
	);
}
