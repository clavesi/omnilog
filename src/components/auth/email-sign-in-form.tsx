"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function EmailSignInForm() {
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			// Determine if identifier is email or username
			const isEmail = identifier.includes("@");

			let email: string;
			if (isEmail) {
				email = identifier;
			} else {
				// Look up email by username via API
				const lookupResponse = await fetch("/api/auth/lookup-email", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ identifier }),
				});

				if (!lookupResponse.ok) {
					setError("Invalid username or email");
					setIsLoading(false);
					return;
				}

				const lookupData = await lookupResponse.json();
				email = lookupData.email;
			}

			const { error: signInError } = await authClient.signIn.email({
				email,
				password,
			});

			if (signInError) {
				setError(signInError.message || "Failed to sign in");
				setIsLoading(false);
				return;
			}

			router.push("/dashboard");
		} catch (_err) {
			setError("An unexpected error occurred");
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label htmlFor="identifier" className="block text-sm font-medium mb-1">
					Username or Email
				</label>
				<input
					id="identifier"
					type="text"
					required
					value={identifier}
					onChange={(e) => setIdentifier(e.target.value)}
					className="w-full px-3 py-2 border rounded-md"
					placeholder="username or email@example.com"
				/>
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
				/>
			</div>

			{error && (
				<div className="text-sm text-red-600 bg-red-50 p-3 rounded">
					{error}
				</div>
			)}

			<Button type="submit" className="w-full" size="lg" disabled={isLoading}>
				{isLoading ? "Signing in..." : "Sign In"}
			</Button>
		</form>
	);
}
