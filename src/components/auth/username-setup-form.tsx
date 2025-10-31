"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useUsernameCheck } from "./use-username-check";

export function UsernameSetupForm() {
	const [username, setUsername] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const { usernameStatus, setUsernameStatus, checkUsername } =
		useUsernameCheck();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		if (usernameStatus !== "available") {
			setError("Please choose an available username");
			setIsLoading(false);
			return;
		}

		try {
			const { error: updateError } = await authClient.updateUser({
				username, // Better Auth will auto-set displayUsername to match
			});

			if (updateError) {
				setError(updateError.message || "Failed to set username");
				setIsLoading(false);
				return;
			}

			// Success! Redirect to homepage
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
				<p className="text-sm text-muted-foreground mt-1">
					This will be your profile URL: /u/{username || "username"}
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
					usernameStatus === "invalid" ||
					username.length < 3
				}
			>
				{isLoading ? "Setting up..." : "Continue"}
			</Button>
		</form>
	);
}
