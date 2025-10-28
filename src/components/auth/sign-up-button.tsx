"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export function SignUpButton() {
	const [isLoading, setIsLoading] = useState(false);

	return (
		<Button
			className="w-full"
			size="lg"
			disabled={isLoading}
			onClick={async () => {
				setIsLoading(true);
				try {
					await authClient.signIn.social({
						provider: "github",
						callbackURL: "/dashboard",
						errorCallbackURL: "/signup?error=auth-failed",
						newUserCallbackURL: "/dashboard",
					});
				} catch (error) {
					console.error("Sign up error:", error);
					setIsLoading(false);
				}
			}}
		>
			{isLoading ? "Creating account..." : "Sign Up with GitHub"}
		</Button>
	);
}
