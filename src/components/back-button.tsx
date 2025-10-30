"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function BackButton({ href = "/" }: { href?: string }) {
	return (
		<Link href={href}>
			<Button variant="ghost" size="sm" className="mb-4">
				<svg
					className="mr-2 h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
				Back
			</Button>
		</Link>
	);
}
