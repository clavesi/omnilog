"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
	const router = useRouter();

	return (
		<Button
			variant="outline"
			onClick={async () => {
				await authClient.signOut({
					fetchOptions: {
						onSuccess: () => {
							router.push("/login");
						},
					},
				});
			}}
		>
			Sign Out
		</Button>
	);
}
