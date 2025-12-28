import {
  createFileRoute,
  Link,
  useNavigate,
  redirect,
} from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { supabase } from "../../lib/supabase";
import { Button } from "../../ui/button";
import Logo from "/prodigylogos/light/logo1.svg";
import { useToast } from "../../hooks/useToast";
import DecorativeRightSide from "/svgs/patterns/decorative-right-side.svg";
import EllipseCenterLeft from "/svgs/ellipse/ellipse-center-left.svg";

export const Route = createFileRoute("/auth/login")({
  beforeLoad: () => {
    const { isAuthenticated, isLoading } = useAuthStore.getState();

    // Only redirect if auth is loaded and user is authenticated
    if (!isLoading && isAuthenticated) {
      throw redirect({
        to: "/dashboard",
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const signIn = useAuthStore((state) => state.signIn);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyStep, setIsVerifyStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentVerificationCode, setSentVerificationCode] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const assets = useMemo(
    () => ({
      google: "/images/logos/google.png",
      divider:
        "https://www.figma.com/api/mcp/asset/46d22730-9df8-461e-9241-1e295b2063e6",
      ellipse:
        // "https://www.figma.com/api/mcp/asset/bcefac66-a675-410b-8057-af4e590bc3b3",
        EllipseCenterLeft,
      accent:
        // "https://www.figma.com/api/mcp/asset/12c2df9b-9fda-4258-8e71-e26de5a4c86d",
        DecorativeRightSide,
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
      const res = await fetch(resource, {
        ...options,
        signal: controller.signal,
      });
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  async function sendVerificationEmail(
    code: string,
    targetEmail: string,
    fName: string,
    lName: string
  ) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    try {
      const response = await fetchWithTimeout(
        `${supabaseUrl}/functions/v1/send-signup-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify({
            to: targetEmail,
            firstName: fName,
            lastName: lName,
            verificationCode: code,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text().catch(() => null);
        console.warn("send-signup-email returned non-OK:", text);
        toast.error(
          "Verification email could not be sent. You can resend the code."
        );
        return;
      }

      toast.success("Check your email for the verification code");
    } catch (emailError: any) {
      if (emailError?.name === "AbortError") {
        toast.error("Email sending timed out. You can resend the code.");
      } else {
        console.error("Error sending verification email:", emailError);
        toast.error(
          "Failed to send verification email. You can resend the code."
        );
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Ensure any previous session is cleared before attempting login
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore sign out errors
      }
      localStorage.removeItem("sb-ftuiloyegcipkupbtias-auth-token");

      await signIn(email, password);

      // Check profile verification status and onboarding
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select(
            "is_email_verified, first_name, last_name, has_completed_onboarding"
          )
          .eq("id", userId)
          .maybeSingle();

        if (profile && profile.is_email_verified === false) {
          // Store profile names for verification email
          setFirstName(profile.first_name || "");
          setLastName(profile.last_name || "");

          // Force sign out and clear local storage
          await supabase.auth.signOut();
          localStorage.removeItem("sb-ftuiloyegcipkupbtias-auth-token");

          // Send verification code and show verification UI
          const generatedCode = Math.floor(
            100000 + Math.random() * 900000
          ).toString();
          setSentVerificationCode(generatedCode);
          setVerificationCode("");
          await sendVerificationEmail(
            generatedCode,
            email,
            profile.first_name || "",
            profile.last_name || ""
          );
          setIsVerifyStep(true);
          setIsLoading(false);
          return;
        }

        // Check onboarding status and redirect accordingly
        if (!profile?.has_completed_onboarding) {
          navigate({ to: "/onboarding" });
        } else {
          navigate({ to: "/dashboard" });
        }
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyStep) {
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
            <img src={Logo} alt="Prodigitality" className="w-60" />

            <div className="flex flex-col gap-3">
              <h1 className="text-4xl font-normal text-black">
                Verify your email
              </h1>
              <p className="text-lg font-normal text-[#020202]/80">
                We sent a verification code to {email}. Enter it below to finish
                signing in.
              </p>
            </div>

            <form
              onSubmit={async (evt) => {
                evt.preventDefault();
                if (!verificationCode) {
                  toast.error("Please enter the verification code");
                  return;
                }

                if (verificationCode !== sentVerificationCode) {
                  toast.error("Invalid verification code");
                  return;
                }

                setVerifyLoading(true);
                try {
                  // Sign in the user after successful verification
                  const { error: signInError } =
                    await supabase.auth.signInWithPassword({
                      email,
                      password,
                    });

                  if (signInError) throw signInError;

                  const { data: authData } = await supabase.auth.getUser();
                  if (authData.user) {
                    await supabase
                      .from("profiles")
                      .update({ is_email_verified: true })
                      .eq("id", authData.user.id);
                  }

                  toast.success("Email verified successfully!");
                  navigate({ to: "/onboarding" });
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Verification failed"
                  );
                } finally {
                  setVerifyLoading(false);
                }
              }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#020202]">
                  Verification Code
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  required
                  className="w-full rounded-md border border-[#d4d4d4] px-4 py-3 text-center text-2xl tracking-[0.25em] text-[#020202] placeholder:text-[#020202]/50 focus:border-[#ff9900] focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30"
                  maxLength={6}
                />
              </div>

              <div className="flex flex-col items-center gap-3">
                <Button
                  type="submit"
                  disabled={verifyLoading}
                  variant="contained"
                  colorScheme="primary"
                  className="w-[255px] bg-[#ff9900] px-10 py-3 text-lg font-semibold text-white shadow-[0_1px_5px_rgba(0,0,0,0.12),0_2px_2px_rgba(0,0,0,0.14),0_3px_1px_-2px_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-0.5 hover:bg-[#ff9900] disabled:hover:translate-y-0"
                >
                  {verifyLoading ? "Verifying..." : "Verify & Sign In"}
                </Button>

                <button
                  type="button"
                  disabled={isResending}
                  onClick={async () => {
                    setIsResending(true);
                    try {
                      const generatedCode = Math.floor(
                        100000 + Math.random() * 900000
                      ).toString();
                      setSentVerificationCode(generatedCode);
                      setVerificationCode("");
                      await sendVerificationEmail(
                        generatedCode,
                        email,
                        firstName,
                        lastName
                      );
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Failed to resend code"
                      );
                    } finally {
                      setIsResending(false);
                    }
                  }}
                  className="text-sm font-normal text-[#020202] transition-colors hover:text-[#ff9900] disabled:opacity-60"
                >
                  {isResending ? "Resending..." : "Resend Code"}
                </button>
              </div>

              <div className="text-center text-sm text-[#020202]/70">
                Signed in on the wrong account?{" "}
                <button
                  type="button"
                  className="text-[#ff9900] hover:text-[#ff9900]/80"
                  onClick={() => {
                    setIsVerifyStep(false);
                    setVerificationCode("");
                    setSentVerificationCode("");
                  }}
                >
                  Go back
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
                className="cursor-pointer flex w-full items-center justify-center gap-3 rounded-md border border-[#d4d4d4] bg-white px-4 py-3 text-base font-semibold text-[#020202] shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <img
                  src={assets.google}
                  alt="Google"
                  className="h-7 w-7 object-contain mr-2"
                />
                <span className="leading-none">Sign in with Google</span>
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
