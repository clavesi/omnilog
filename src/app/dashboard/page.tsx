import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { requireAuth } from "@/lib/session";

export const metadata: Metadata = {
	title: "Dashboard",
	description: "Your personal dashboard",
};

export default async function DashboardPage() {
	const session = await requireAuth();

	// Check if user needs to set up username
	const existingUser = await db
		.select()
		.from(user)
		.where(eq(user.id, session.user.id))
		.limit(1);

	if (existingUser.length > 0 && !existingUser[0].username) {
		// User needs to set up username, redirect to setup page
		redirect("/setup/username");
	}

	const userUsername = existingUser[0]?.username || session.user.email;

	return (
		<div className="min-h-screen w-full bg-background">
			{/* Main Content */}
			<main className="container mx-auto px-4 py-8 w-full">
				<div className="w-full max-w-7xl mx-auto space-y-8">
					{/* Welcome Section */}
					<div className="rounded-lg border bg-card p-6">
						<h2 className="text-2xl font-bold">
							Welcome back, {userUsername}!
						</h2>
						<p className="mt-2 text-muted-foreground">
							Here's what's happening with your account today.
						</p>
					</div>

					{/* Stats Grid */}
					<div className="grid gap-4 md:grid-cols-3">
						<div className="rounded-lg border bg-card p-6">
							<h3 className="text-sm font-medium text-muted-foreground">
								Total Logs
							</h3>
							<p className="mt-2 text-3xl font-bold">0</p>
						</div>
						<div className="rounded-lg border bg-card p-6">
							<h3 className="text-sm font-medium text-muted-foreground">
								This Week
							</h3>
							<p className="mt-2 text-3xl font-bold">0</p>
						</div>
						<div className="rounded-lg border bg-card p-6">
							<h3 className="text-sm font-medium text-muted-foreground">
								Active Projects
							</h3>
							<p className="mt-2 text-3xl font-bold">0</p>
						</div>
					</div>

					{/* Quick Actions */}
					<div className="rounded-lg border bg-card p-6">
						<h3 className="text-lg font-semibold">Quick Actions</h3>
						<div className="mt-4 flex flex-wrap gap-3">
							<Button>Create New Log</Button>
							<Button variant="outline">View All Logs</Button>
							<Button variant="outline">Settings</Button>
						</div>
					</div>

					{/* Recent Activity */}
					<div className="rounded-lg border bg-card p-6">
						<h3 className="text-lg font-semibold">Recent Activity</h3>
						<div className="mt-4 space-y-4">
							<p className="text-sm text-muted-foreground">
								No recent activity yet. Start by creating your first log!
							</p>
						</div>
					</div>

					{/* User Info Card */}
					<div className="rounded-lg border bg-card p-6">
						<h3 className="text-lg font-semibold">Account Information</h3>
						<div className="mt-4 space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Email:</span>
								<span className="font-medium">{session.user.email}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">User ID:</span>
								<span className="font-mono text-xs">{session.user.id}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Joined:</span>
								<span className="font-medium">
									{new Date(session.user.createdAt).toLocaleDateString()}
								</span>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
