"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useUsernameCheck } from "./use-username-check";

export function EmailSignUpForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [, setIsCheckingEmail] = useState(false);
	const [emailStatus, setEmailStatus] = useState<
		"idle" | "checking" | "available" | "taken" | "invalid"
	>("idle");
	const router = useRouter();

	const { usernameStatus, setUsernameStatus, checkUsername } =
		useUsernameCheck();

	const checkEmail = async (value: string) => {
		if (!value || !value.includes("@")) {
			setEmailStatus("invalid");
			return;
		}

		setIsCheckingEmail(true);
		setEmailStatus("checking");

		try {
			const response = await fetch("/api/email/check", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: value }),
			});

			const data = await response.json();
			if (data.available === false && data.reason === "invalid") {
				setEmailStatus("invalid");
			} else {
				setEmailStatus(data.available ? "available" : "taken");
			}
		} catch (_err) {
			setEmailStatus("idle");
		} finally {
			setIsCheckingEmail(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		// Validate username is available before proceeding
		if (!username || usernameStatus !== "available") {
			setError("Please choose an available username");
			setIsLoading(false);
			return;
		}

		try {
			const { error: signUpError } = await authClient.signUp.email({
				email,
				password,
				name: username, // Better Auth requires a name field, using username
				username, // Username plugin will auto-set displayUsername to match
			});

			if (signUpError) {
				setError(signUpError.message || "Failed to create account");
				setIsLoading(false);
				return;
			}

			// Username is set during sign-up, go to homepage
			router.push("/");
		} catch (_err) {
			setError("An unexpected error occurred");
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label htmlFor="username" className="block text-sm font-medium mb-1">
					Username
				</label>
				<input
					id="username"
					type="text"
					required
					value={username}
					onChange={(e) => {
						const value = e.target.value.toLowerCase();
						setUsername(value);
						if (value.length >= 3) {
							checkUsername(value);
						} else {
							setUsernameStatus("idle");
						}
					}}
					className="w-full px-3 py-2 border rounded-md"
					placeholder="johndoe"
					minLength={3}
					maxLength={20}
					pattern="[a-z0-9_.]{3,20}"
				/>
				{usernameStatus === "checking" && (
					<p className="text-sm text-muted-foreground mt-1">Checking...</p>
				)}
				{usernameStatus === "available" && (
					<p className="text-sm text-green-600 mt-1">✓ Available</p>
				)}
				{usernameStatus === "taken" && (
					<p className="text-sm text-red-600 mt-1">✗ Username is taken</p>
				)}
				{usernameStatus === "invalid" && username.length > 0 && (
					<p className="text-sm text-red-600 mt-1">
						Username must be 3-20 characters (letters, numbers, _, .)
					</p>
				)}
			</div>

			<div>
				<label htmlFor="email" className="block text-sm font-medium mb-1">
					Email
				</label>
				<input
					id="email"
					type="email"
					required
					value={email}
					onChange={(e) => {
						const value = e.target.value.toLowerCase();
						setEmail(value);
						if (value.includes("@")) {
							checkEmail(value);
						} else {
							setEmailStatus("idle");
						}
					}}
					className="w-full px-3 py-2 border rounded-md"
					placeholder="john@example.com"
				/>
				{emailStatus === "checking" && (
					<p className="text-sm text-muted-foreground mt-1">Checking...</p>
				)}
				{emailStatus === "available" && (
					<p className="text-sm text-green-600 mt-1">✓ Available</p>
				)}
				{emailStatus === "taken" && (
					<p className="text-sm text-red-600 mt-1">
						✗ Email is already registered
					</p>
				)}
				{emailStatus === "invalid" && email.length > 0 && (
					<p className="text-sm text-red-600 mt-1">
						Please enter a valid email address
					</p>
				)}
			</div>

			<div>
				<label htmlFor="password" className="block text-sm font-medium mb-1">
					Password
				</label>
				<input
					id="password"
					type="password"
					required
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="w-full px-3 py-2 border rounded-md"
					placeholder="••••••••"
					minLength={8}
				/>
				<p className="text-sm text-muted-foreground mt-1">
					Must be at least 8 characters
				</p>
			</div>

			{error && (
				<div className="text-sm text-red-600 bg-red-50 p-3 rounded">
					{error}
				</div>
			)}

			<Button
				type="submit"
				className="w-full"
				size="lg"
				disabled={
					isLoading ||
					usernameStatus === "taken" ||
					usernameStatus === "checking" ||
					emailStatus === "taken" ||
					emailStatus === "checking" ||
					emailStatus === "invalid" ||
					username.length < 3 ||
					!email.includes("@")
				}
			>
				{isLoading ? "Creating account..." : "Create Account"}
			</Button>
		</form>
	);
}
