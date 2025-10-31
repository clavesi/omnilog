import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailSignUpForm } from "@/components/auth/email-sign-up-form";
import { GitHubSignUpButton } from "@/components/auth/github-sign-up-button";
import { GoogleSignUpButton } from "@/components/auth/google-sign-up-button";
import { BackButton } from "@/components/back-button";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
	title: "Sign Up",
	description: "Create your account",
};

export default async function SignUpPage() {
	const session = await getSession();

	// If already logged in, redirect to homepage
	if (session) {
		redirect("/");
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				<BackButton />
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Get started with your free account
					</p>
				</div>

				<div className="mt-8 space-y-6">
					{/* Social Sign-Up */}
					<div className="space-y-3">
						<GoogleSignUpButton />
						<GitHubSignUpButton />
					</div>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">
								Or continue with email
							</span>
						</div>
					</div>

					{/* Email/Password Sign-Up */}
					<EmailSignUpForm />

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
