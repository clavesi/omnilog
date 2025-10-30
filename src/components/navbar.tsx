import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";

export async function Navbar() {
	const session = await getSession();

	return (
		<header className="border-b w-full bg-background">
			<div className="container mx-auto flex h-16 items-center justify-between px-4 w-full">
				<h1 className="text-xl font-bold">
					<Link href={session ? "/dashboard" : "/"}>OmniLog</Link>
				</h1>
				{session ? (
					<SignOutButton />
				) : (
					<div className="flex gap-2">
						<Button variant="ghost" asChild>
							<Link href="/login">Sign In</Link>
						</Button>
						<Button asChild>
							<Link href="/signup">Sign Up</Link>
						</Button>
					</div>
				)}
			</div>
		</header>
	);
}
