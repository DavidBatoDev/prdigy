import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../../ui/button";
import Logo from "/prodigylogos/light/logo1.svg";

export const Route = createFileRoute("/auth/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const signIn = useAuthStore((state) => state.signIn);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const assets = useMemo(
    () => ({
      google:
        "https://www.figma.com/api/mcp/asset/0d946143-28bd-4720-9c80-e5928305831c",
      facebook:
        "https://www.figma.com/api/mcp/asset/8b567108-efc0-4c21-b05e-7dd003e2e752",
      divider:
        "https://www.figma.com/api/mcp/asset/46d22730-9df8-461e-9241-1e295b2063e6",
      ellipse:
        "https://www.figma.com/api/mcp/asset/bcefac66-a675-410b-8057-af4e590bc3b3",
      accent:
        "https://www.figma.com/api/mcp/asset/12c2df9b-9fda-4258-8e71-e26de5a4c86d",
    }),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signIn(email, password);
      // Redirect to home page after successful login
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_60%,rgba(255,153,102,0.18),rgba(255,255,255,0.75)_45%,white_65%)]" />
      <img
        src={assets.ellipse}
        alt=""
        className="pointer-events-none absolute -left-40 top-1/2 h-[414px] w-[414px] -translate-y-1/2 opacity-70"
      />
      <img
        src={assets.accent}
        alt=""
        className="pointer-events-none absolute right-0 top-0 h-full max-w-[50%] object-cover"
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-start px-6 py-16 lg:px-12">
        <div className="flex w-full max-w-[720px] flex-col gap-10">
          <div className="flex flex-col gap-8">
            <img src={Logo} alt="Prodigitality" className="w-60" />

            <div className="flex flex-col gap-3">
              <h1 className="text-4xl font-normal text-black">Welcome back!</h1>
              <p className="text-lg font-normal text-[#020202]/80">
                Don’t have an account yet?{" "}
                <Link
                  to="/auth/signup"
                  className="text-[#ff9900] transition-colors hover:text-[#ff9900]/80"
                >
                  Create new account
                </Link>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                className="flex w-[320px] items-center justify-center gap-4 rounded-md border border-[#b1b1b1] bg-white px-6 py-3 text-base font-normal text-[#020202]/70 shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <img src={assets.google} alt="Google" className="h-6 w-6" />
                <span>Login with Google</span>
              </button>
              <button
                type="button"
                className="flex w-[320px] items-center justify-center gap-3 rounded-md border border-[#b1b1b1] bg-[#4267b2] px-6 py-3 text-base font-normal text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <img src={assets.facebook} alt="Facebook" className="h-6 w-6" />
                <span>Login with Facebook</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-3">
              <img
                src={assets.divider}
                alt=""
                className="h-px w-full max-w-[720px]"
              />
              <span className="min-w-12 rounded bg-white px-3 py-1 text-sm font-semibold text-[#293854] shadow-sm">
                OR
              </span>
              <img
                src={assets.divider}
                alt=""
                className="h-px w-full max-w-[720px]"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#020202]">
                Email or Name
              </label>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-[#d4d4d4] px-4 py-3 text-base text-[#020202] placeholder:text-[#020202]/50 focus:border-[#ff9900] focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#020202]">
                Password
              </label>
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-[#d4d4d4] px-4 py-3 text-base text-[#020202] placeholder:text-[#020202]/50 focus:border-[#ff9900] focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30"
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-[#020202]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#b1b1b1] text-[#ff9900] focus:ring-[#ff9900]"
              />
              <span>Keep me login</span>
            </label>

            {error && (
              <div className="rounded-md border border-red-500/70 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                variant="contained"
                colorScheme="primary"
                className="w-[255px] bg-[#ff9900] px-10 py-3 text-lg font-semibold text-white shadow-[0_1px_5px_rgba(0,0,0,0.12),0_2px_2px_rgba(0,0,0,0.14),0_3px_1px_-2px_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-0.5 hover:bg-[#ff9900] disabled:hover:translate-y-0"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              <button
                type="button"
                className="text-sm font-normal text-[#020202] transition-colors hover:text-[#ff9900]"
              >
                Forgot Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
