"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export type UsernameStatus =
	| "idle"
	| "checking"
	| "available"
	| "taken"
	| "invalid";

export function useUsernameCheck() {
	const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
	const [isCheckingUsername, setIsCheckingUsername] = useState(false);

	const checkUsername = async (value: string) => {
		if (!value || value.length < 3) {
			setUsernameStatus("invalid");
			return;
		}

		// Validate format (matches Better Auth default: alphanumeric, underscore, dot)
		if (!/^[a-z0-9_.]{3,20}$/i.test(value)) {
			setUsernameStatus("invalid");
			return;
		}

		setIsCheckingUsername(true);
		setUsernameStatus("checking");

		try {
			const { data, error } = await authClient.isUsernameAvailable({
				username: value,
			});
			if (error) {
				setUsernameStatus("idle");
				return;
			}
			setUsernameStatus(data?.available ? "available" : "taken");
		} catch (_err) {
			setUsernameStatus("idle");
		} finally {
			setIsCheckingUsername(false);
		}
	};

	return {
		usernameStatus,
		setUsernameStatus,
		isCheckingUsername,
		checkUsername,
	};
}
