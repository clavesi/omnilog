import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/auth/sign-in-button";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Login",
	description: "Sign in to your account",
};

export default async function LoginPage() {
	const session = await getSession();

	// If already logged in, redirect to dashboard
	if (session) {
		redirect("/dashboard");
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Sign in to your account to continue
					</p>
				</div>

				<div className="mt-8 space-y-4">
					<SignInButton />
				</div>

				<div className="text-center">
					<p className="text-sm text-muted-foreground">
						Don't have an account?{" "}
						<Link
							href="/signup"
							className="font-medium text-primary hover:underline"
						>
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
