import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpButton } from "@/components/auth/sign-up-button";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
	title: "Sign Up",
	description: "Create your account",
};

export default async function SignUpPage() {
	const session = await getSession();

	// If already logged in, redirect to dashboard
	if (session) {
		redirect("/dashboard");
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Get started with your free account
					</p>
				</div>

				<div className="mt-8 space-y-4">
					<SignUpButton />

					<p className="text-center text-sm text-muted-foreground">
						By signing up, you agree to our Terms of Service and Privacy Policy
					</p>
				</div>

				<div className="text-center">
					<p className="text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link
							href="/login"
							className="font-medium text-primary hover:underline"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
