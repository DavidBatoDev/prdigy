/**
 * Protected Route Component
 * Use this to protect routes that require authentication
 */

import { useAuthStore } from "../../stores/authStore";
import type { PersonaType } from "../../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPersona?: PersonaType[];
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredPersona,
  fallback = <div>Please log in to access this page</div>,
  loadingFallback = <div>Loading...</div>,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    profile: state.profile,
  }));

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check persona requirements
  if (requiredPersona && profile) {
    if (!requiredPersona.includes(profile.active_persona)) {
      return (
        <div>
          Access denied. Required persona: {requiredPersona.join(" or ")}
        </div>
      );
    }
  }

  return <>{children}</>;
}
