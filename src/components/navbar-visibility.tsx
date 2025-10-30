"use client";

import { usePathname } from "next/navigation";

export function NavbarVisibility({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	// Hide navbar on login and signup pages
	const hideNavbar = pathname === "/login" || pathname === "/signup";

	if (hideNavbar) {
		return null;
	}

	return <>{children}</>;
}
