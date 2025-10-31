import { BookOpen, Film, Gamepad2, Music, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LoggedInHomepageProps {
	username: string;
}

export function LoggedInHomepage({ username }: LoggedInHomepageProps) {
	return (
		<div className="min-h-screen w-full bg-background">
			<main className="container mx-auto px-4 py-8 w-full">
				<div className="w-full max-w-7xl mx-auto space-y-8">
					{/* Welcome Header */}
					<div className="rounded-lg border bg-card p-6">
						<h1 className="text-3xl font-bold">Welcome back, {username}!</h1>
						<p className="mt-2 text-muted-foreground">
							See what your friends are reading, watching, and discovering.
						</p>
					</div>

					<div className="grid gap-8 lg:grid-cols-3">
						{/* Main Feed - Takes 2 columns */}
						<div className="lg:col-span-2 space-y-6">
							{/* Following Activity Feed */}
							<section>
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-2xl font-semibold">Following</h2>
									<Button variant="ghost" size="sm" asChild>
										<Link href="/following">View All</Link>
									</Button>
								</div>
								<div className="space-y-4">
									{/* Activity Feed Items */}
									<div className="rounded-lg border bg-card p-6">
										<div className="flex items-start gap-4">
											<div className="flex-1">
												<p className="text-sm text-muted-foreground">
													No activity from people you follow yet.
												</p>
												<p className="mt-2 text-sm text-muted-foreground">
													Start following users to see what they're reading,
													watching, and discovering!
												</p>
											</div>
										</div>
									</div>
									{/* Placeholder for future activity items */}
									<div className="rounded-lg border bg-card p-6 opacity-50">
										<div className="flex items-start gap-4">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													<span className="font-medium">@username</span>
													<span className="text-sm text-muted-foreground">
														just finished
													</span>
												</div>
												<div className="flex items-center gap-2">
													<BookOpen className="size-4 text-muted-foreground" />
													<span className="font-medium">Book Title</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</section>
						</div>

						{/* Sidebar - Takes 1 column */}
						<div className="space-y-6">
							{/* Popular Media Section */}
							<section>
								<div className="flex items-center gap-2 mb-4">
									<TrendingUp className="size-5" />
									<h2 className="text-xl font-semibold">Popular Now</h2>
								</div>
								<div className="space-y-4">
									{/* Popular Media Categories */}
									<div className="rounded-lg border bg-card p-4">
										<div className="flex items-center gap-3 mb-3">
											<BookOpen className="size-5 text-muted-foreground" />
											<h3 className="font-semibold">Books</h3>
										</div>
										<p className="text-sm text-muted-foreground">
											No popular books yet. Check back soon!
										</p>
									</div>

									<div className="rounded-lg border bg-card p-4">
										<div className="flex items-center gap-3 mb-3">
											<Film className="size-5 text-muted-foreground" />
											<h3 className="font-semibold">Movies & TV</h3>
										</div>
										<p className="text-sm text-muted-foreground">
											No popular media yet. Check back soon!
										</p>
									</div>

									<div className="rounded-lg border bg-card p-4">
										<div className="flex items-center gap-3 mb-3">
											<Music className="size-5 text-muted-foreground" />
											<h3 className="font-semibold">Music</h3>
										</div>
										<p className="text-sm text-muted-foreground">
											No popular music yet. Check back soon!
										</p>
									</div>

									<div className="rounded-lg border bg-card p-4">
										<div className="flex items-center gap-3 mb-3">
											<Gamepad2 className="size-5 text-muted-foreground" />
											<h3 className="font-semibold">Games</h3>
										</div>
										<p className="text-sm text-muted-foreground">
											No popular games yet. Check back soon!
										</p>
									</div>
								</div>
							</section>

							{/* Quick Actions */}
							<section>
								<h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
								<div className="space-y-2">
									<Button className="w-full justify-start" asChild>
										<Link href="/dashboard">Go to Dashboard</Link>
									</Button>
									<Button
										className="w-full justify-start"
										variant="outline"
										asChild
									>
										<Link href="/discover">Discover Media</Link>
									</Button>
								</div>
							</section>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
