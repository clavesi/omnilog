import type { Metadata } from "next";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/session";

export const metadata: Metadata = {
	title: "Dashboard",
	description: "Your personal dashboard",
};

export default async function DashboardPage() {
	const session = await requireAuth();

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b">
				<div className="container mx-auto flex h-16 items-center justify-between px-4">
					<h1 className="text-xl font-bold">OmniLog</h1>
					<SignOutButton />
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-8">
				<div className="mx-auto max-w-4xl space-y-8">
					{/* Welcome Section */}
					<div className="rounded-lg border bg-card p-6">
						<h2 className="text-2xl font-bold">
							Welcome back, {session.user.name || session.user.email}!
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
