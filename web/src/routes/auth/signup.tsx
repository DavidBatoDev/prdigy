import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "../../stores/authStore";
import { SignupLayout } from "../../components/auth/signup/SignupLayout";
import { SignupForm } from "../../components/auth/signup/SignupForm";

export const Route = createFileRoute("/auth/signup")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    return {
      redirect: (search.redirect as string) || undefined,
    };
  },
  beforeLoad: () => {
    const { isAuthenticated, isLoading } = useAuthStore.getState();
    const isInSignupFlow = sessionStorage.getItem("isInSignupFlow") === "true";
    if (!isLoading && isAuthenticated && !isInSignupFlow) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();

  if (search.redirect) {
    sessionStorage.setItem("signup_redirect", search.redirect);
  }

  return (
    <SignupLayout>
      <SignupForm />
    </SignupLayout>
  );
}
