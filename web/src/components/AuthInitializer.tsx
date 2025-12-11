/**
 * Auth initialization component
 * Call this in your root layout or App.tsx
 */

import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";

interface AuthInitializerProps {
	children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
	const initialize = useAuthStore((state) => state.initialize);

	useEffect(() => {
		initialize();
	}, [initialize]);

	return <>{children}</>;
}
