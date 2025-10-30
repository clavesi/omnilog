import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SignInButton } from "@/components/auth/sign-in-button";
import { BackButton } from "@/components/back-button";
import { getSession } from "@/lib/session";

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
				<BackButton />
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Sign in to your account to continue
					</p>
				</div>

				<div className="mt-8 space-y-6">
					{/* Social Sign-In */}
					<div className="space-y-3">
						<GoogleSignInButton />
						<SignInButton />
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

					{/* Email/Password Sign-In */}
					<EmailSignInForm />
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
