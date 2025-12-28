import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "../../ui/button";
import { useToast } from "../../hooks/useToast";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordRoute,
});

function ForgotPasswordRoute() {
  const navigate = useNavigate();
  const toast = useToast();

  const assets = useMemo(
    () => ({
      divider:
        "https://www.figma.com/api/mcp/asset/46d22730-9df8-461e-9241-1e295b2063e6",
    }),
    []
  );

  const EMAIL_FETCH_TIMEOUT_MS = 8000;

  async function fetchWithTimeout(
    resource: string,
    options: RequestInit = {},
    timeout = EMAIL_FETCH_TIMEOUT_MS
  ) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(resource, { ...options, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetchWithTimeout(`${supabaseUrl}/functions/v1/send-password-reset-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.warn("send-password-reset-email returned non-OK:", text);
        toast.error("Could not send reset code. Please try again.");
        return;
      }

      toast.success("Check your email for the reset code");
      setStep("verify");
    } catch (err: any) {
      if (err?.name === "AbortError") {
        toast.error("Request timed out. Try again.");
      } else {
        toast.error("Failed to send reset code");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!code || code.length !== 6) {
        toast.error("Enter the 6-digit code");
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      const res = await fetchWithTimeout(`${supabaseUrl}/functions/v1/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload?.success === false) {
        toast.error(payload?.error || "Invalid code or request failed");
        return;
      }

      toast.success("Password updated. Please log in.");
      navigate({ to: "/auth/login" });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        toast.error("Verification timed out. Try again.");
      } else {
        toast.error("Failed to reset password");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-start px-6 py-16 lg:px-12">
        <div className="flex w-full max-w-[720px] flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-normal text-black">Forgot your password?</h1>
            <p className="text-lg font-normal text-[#020202]/80">
              {step === "request"
                ? "Enter your email to receive a verification code."
                : "Enter the verification code from your email and a new password."}
            </p>
          </div>

          {step === "request" ? (
            <form onSubmit={requestReset} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#020202]">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-md border border-[#d4d4d4] px-4 py-3 text-base text-[#020202] placeholder:text-[#020202]/50 focus:border-[#ff9900] focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30"
                />
              </div>
              <div className="flex items-center justify-center gap-3">
                <img src={assets.divider} alt="" className="h-px w-full max-w-[720px]" />
              </div>
              <div className="flex flex-col items-center gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="contained"
                  colorScheme="primary"
                  className="w-[255px] bg-[#ff9900] px-10 py-3 text-lg font-semibold text-white shadow-[0_1px_5px_rgba(0,0,0,0.12),0_2px_2px_rgba(0,0,0,0.14),0_3px_1px_-2px_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-0.5 hover:bg-[#ff9900] disabled:hover:translate-y-0"
                >
                  {isLoading ? "Sending..." : "Send Code"}
                </Button>
                <Link to="/auth/login" className="text-sm font-normal text-[#020202] transition-colors hover:text-[#ff9900]">
                  Back to login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={verifyAndReset} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#020202]">Verification Code</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  className="w-full rounded-md border border-[#d4d4d4] px-4 py-3 text-center text-2xl tracking-[0.25em] text-[#020202] placeholder:text-[#020202]/50 focus:border-[#ff9900] focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30"
                  maxLength={6}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#020202]">New Password</label>
                <input
                  type="password"
                  placeholder="********"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-[#d4d4d4] px-4 py-3 text-base text-[#020202] placeholder:text-[#020202]/50 focus:border-[#ff9900] focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30"
                />
              </div>
              <div className="flex flex-col items-center gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="contained"
                  colorScheme="primary"
                  className="w-[255px] bg-[#ff9900] px-10 py-3 text-lg font-semibold text-white shadow-[0_1px_5px_rgba(0,0,0,0.12),0_2px_2px_rgba(0,0,0,0.14),0_3px_1px_-2px_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-0.5 hover:bg-[#ff9900] disabled:hover:translate-y-0"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
                <button
                  type="button"
                  className="text-sm font-normal text-[#020202] transition-colors hover:text-[#ff9900]"
                  onClick={() => setStep("request")}
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
