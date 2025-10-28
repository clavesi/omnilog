import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";

export default async function Home() {
	const session = await getSession();

	// Redirect to dashboard if logged in
	if (session) {
		redirect("/dashboard");
	}

	return (
		<div className="flex min-h-screen flex-col">
			{/* Header */}
			<header className="border-b">
				<div className="container mx-auto flex h-16 items-center justify-between px-4">
					<h1 className="text-xl font-bold">OmniLog</h1>
					<div className="flex gap-2">
						<Button variant="ghost" asChild>
							<Link href="/login">Sign In</Link>
						</Button>
						<Button asChild>
							<Link href="/signup">Sign Up</Link>
						</Button>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<main className="flex flex-1 items-center justify-center">
				<div className="container mx-auto px-4 text-center">
					<h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
						Welcome to OmniLog
					</h1>
					<p className="mt-6 text-lg text-muted-foreground">
						Your all-in-one solution for tracking, managing, and organizing
						everything.
					</p>
					<div className="mt-10 flex items-center justify-center gap-4">
						<Button size="lg" asChild>
							<Link href="/signup">Get Started</Link>
						</Button>
						<Button size="lg" variant="outline" asChild>
							<Link href="#features">Learn More</Link>
						</Button>
					</div>
				</div>
			</main>

			{/* Features Section */}
			<section id="features" className="border-t bg-muted/50 py-20">
				<div className="container mx-auto px-4">
					<h2 className="text-center text-3xl font-bold">Features</h2>
					<div className="mt-12 grid gap-8 md:grid-cols-3">
						<div className="rounded-lg border bg-card p-6">
							<h3 className="text-xl font-semibold">Simple & Intuitive</h3>
							<p className="mt-2 text-muted-foreground">
								Easy to use interface that gets out of your way.
							</p>
						</div>
						<div className="rounded-lg border bg-card p-6">
							<h3 className="text-xl font-semibold">Secure</h3>
							<p className="mt-2 text-muted-foreground">
								Your data is protected with enterprise-grade security.
							</p>
						</div>
						<div className="rounded-lg border bg-card p-6">
							<h3 className="text-xl font-semibold">Powerful</h3>
							<p className="mt-2 text-muted-foreground">
								All the features you need to stay organized.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t py-8">
				<div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
					© 2025 OmniLog. All rights reserved.
				</div>
			</footer>
		</div>
	);
}
