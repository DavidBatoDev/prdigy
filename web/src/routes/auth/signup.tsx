import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { supabase } from "../../lib/supabase";
import { Button } from "../../ui/button";
import Logo from "/prodigylogos/light/logo1.svg";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Checkbox,
} from "@mui/material";
import { MuiTelInput } from "mui-tel-input";
import { useToast } from "../../hooks/useToast";
import DecorativeRightSide from "/svgs/patterns/decorative-right-side.svg";
import EllipseBottomRight from "/svgs/ellipse/ellipse-bottom-right.svg";
import EllipseCenterLeft from "/svgs/ellipse/ellipse-center-left.svg";

export const Route = createFileRoute("/auth/signup")({
  component: RouteComponent,
});

function RouteComponent() {
  const signUp = useAuthStore((state) => state.signUp);
  const toast = useToast();
  const [step, setStep] = useState(1); // Step 1: Form, Step 2: Verify Code
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentVerificationCode, setSentVerificationCode] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const assets = useMemo(
    () => ({
      ellipse28:
        // "https://www.figma.com/api/mcp/asset/40e62b5c-fc97-410f-b33c-d2e8283b208d",
        EllipseCenterLeft,
      ellipse29:
        // "https://www.figma.com/api/mcp/asset/01ff7abc-8e87-4c32-9f9b-5a384b30af5d",
        EllipseBottomRight,
      accent:
        // "https://www.figma.com/api/mcp/asset/1a713252-c509-4cef-8a26-4ab7db43b0cb",
        DecorativeRightSide,
    }),
    []
  );

  // Timeout for email requests (prevents a slow edge function from hanging the signup flow)
  const EMAIL_FETCH_TIMEOUT_MS = 8000;

  async function waitForProfile(maxWaitMs: number) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profile) return profile;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error("Profile creation timeout");
  }

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

  async function sendVerificationEmail(code: string) {
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
            to: email,
            firstName,
            lastName,
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

  async function updateProfileDetails() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        gender: gender || null,
        phone_number: phoneNumber?.trim() || null,
        country: country || null,
        date_of_birth: dateOfBirth || null,
        city: city || null,
        zip_code: zipCode || null,
      })
      .eq("id", authData.user.id);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      // Step 1: Validate form and create account
      if (!acceptedTerms) {
        toast.error("Please accept the terms and conditions");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      setIsLoading(true);

      try {
        // Clear auth token from localStorage to ensure session is completely removed
        localStorage.removeItem("sb-ftuiloyegcipkupbtias-auth-token");

        // Create user account
        await signUp(email, password);

        // Wait for profile to be created by database trigger
        await waitForProfile(15000);

        // Update profile with additional details
        await updateProfileDetails();

        // Sign out immediately - user should only be logged in after verification
        await supabase.auth.signOut();

        // Generate and send verification code
        const generatedCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        setSentVerificationCode(generatedCode);

        setStep(2);
        await sendVerificationEmail(generatedCode);
      } catch (err) {
        const message = err instanceof Error ? err.message : "";

        if (
          message.toLowerCase().includes("already registered") ||
          message.toLowerCase().includes("already exists") ||
          message.toLowerCase().includes("duplicate")
        ) {
          toast.error("Email already exists. Try logging in instead.");
        } else {
          toast.error(message || "Signup failed");
        }
      } finally {
        setIsLoading(false);
      }
    } else if (step === 2) {
      // Step 2: Verify code
      if (!verificationCode) {
        toast.error("Please enter the verification code");
        return;
      }

      if (verificationCode !== sentVerificationCode) {
        toast.error("Invalid verification code");
        return;
      }

      setIsLoading(true);

      try {
        // Sign in the user after successful verification
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Update is_email_verified in profiles
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          await supabase
            .from("profiles")
            .update({ is_email_verified: true })
            .eq("id", authData.user.id);
        }

        setSuccess(true);
        toast.success("Email verified successfully!");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Verification failed");
      } finally {
        // Always clear loading state so the UI cannot get stuck
        setIsLoading(false);
      }
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      const generatedCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      setSentVerificationCode(generatedCode);
      setVerificationCode("");

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
              to: email,
              firstName,
              lastName,
              verificationCode: generatedCode,
            }),
          }
        );

        if (!response.ok) {
          const text = await response.text().catch(() => null);
          console.warn("resend send-signup-email returned non-OK:", text);
          throw new Error("Failed to resend verification email");
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          throw new Error("Resend timed out");
        }
        throw err;
      }

      toast.success("Verification code resent to your email");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_60%,rgba(255,153,102,0.18),rgba(255,255,255,0.75)_45%,white_65%)]" />
        <img
          src={assets.ellipse28}
          alt=""
          className="pointer-events-none absolute -left-40 top-1/2 h-[414px] w-[414px] -translate-y-1/2 opacity-70"
        />
        <img
          src={assets.accent}
          alt=""
          className="pointer-events-none absolute right-0 top-0 h-full max-w-[50%] object-cover"
        />

        <div className="relative w-full max-w-md rounded-lg bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-5xl text-green-500">✓</div>
          <h2 className="mb-2 text-2xl font-bold text-black">
            Signup Successful!
          </h2>
          <p className="text-[#020202]/70">
            Check your email to confirm your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_60%,rgba(255,153,102,0.18),rgba(255,255,255,0.75)_45%,white_65%)]" />
      <img
        src={assets.ellipse28}
        alt=""
        className="pointer-events-none absolute -left-40 top-1/2 h-[414px] w-[414px] -translate-y-1/2 opacity-70"
      />
      <img
        src={assets.ellipse29}
        alt=""
        className="pointer-events-none absolute bottom-0 left-[60%] h-[414px] w-[414px] translate-y-1/2 opacity-70"
      />
      <img
        src={assets.accent}
        alt=""
        className="pointer-events-none fixed right-0 top-0 h-screen max-w-[50%] object-cover"
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-start px-6 py-16 lg:px-12">
        <div className="flex w-full max-w-[720px] flex-col gap-12">
          <img src={Logo} alt="Prodigitality" className="w-60" />

          <div className="flex items-center gap-4">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full text-2xl font-medium text-white ${step >= 1 ? "bg-[#ff9900]" : "border-2 border-[#d4d4d4]"}`}
            >
              1
            </div>
            <div
              className={`h-px flex-1 ${step >= 2 ? "bg-[#ff9900]" : "bg-[#d4d4d4]"}`}
            />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full font-medium text-white ${step >= 2 ? "bg-[#ff9900]" : "border-2 border-[#d4d4d4] bg-white"}`}
            >
              2
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <h1 className="text-5xl font-normal text-black">Registration</h1>
              <p className="text-lg font-normal text-black">
                Already have an account?{" "}
                <Link
                  to="/auth/login"
                  className="text-[#ff9900] transition-colors hover:text-[#ff9900]/80"
                >
                  Login here
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {step === 1 ? (
                <>
                  <div className="flex flex-wrap gap-8">
                    <TextField
                      label="First Name"
                      type="text"
                      placeholder="Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="flex-1"
                      style={{ minWidth: "300px" }}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "#d4d4d4" },
                          "&:hover fieldset": { borderColor: "#ff9900" },
                          "&.Mui-focused fieldset": { borderColor: "#ff9900" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#020202",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          "&.Mui-focused": { color: "#ff9900" },
                        },
                      }}
                    />

                    <TextField
                      label="Last Name"
                      type="text"
                      placeholder="Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="flex-1"
                      style={{ minWidth: "300px" }}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "#d4d4d4" },
                          "&:hover fieldset": { borderColor: "#ff9900" },
                          "&.Mui-focused fieldset": { borderColor: "#ff9900" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#020202",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          "&.Mui-focused": { color: "#ff9900" },
                        },
                      }}
                    />
                  </div>

                  <TextField
                    label="Email"
                    type="email"
                    placeholder="abc123@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                    variant="outlined"
                    inputProps={{ autoComplete: "email" }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#b1b1b1" },
                        "&:hover fieldset": { borderColor: "#ff9900" },
                        "&.Mui-focused fieldset": { borderColor: "#ff9900" },
                      },
                      "& .MuiInputLabel-root": {
                        color: "#020202",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        "&.Mui-focused": { color: "#ff9900" },
                      },
                    }}
                  />

                  <div className="flex flex-wrap gap-8">
                    <TextField
                      label="Password"
                      type="password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="flex-1"
                      style={{ minWidth: "300px" }}
                      variant="outlined"
                      inputProps={{ autoComplete: "new-password" }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "#d4d4d4" },
                          "&:hover fieldset": { borderColor: "#ff9900" },
                          "&.Mui-focused fieldset": { borderColor: "#ff9900" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#020202",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          "&.Mui-focused": { color: "#ff9900" },
                        },
                      }}
                    />

                    <TextField
                      label="Confirm Password"
                      type="password"
                      placeholder="********"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="flex-1"
                      style={{ minWidth: "300px" }}
                      variant="outlined"
                      inputProps={{ autoComplete: "new-password" }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "#d4d4d4" },
                          "&:hover fieldset": { borderColor: "#ff9900" },
                          "&.Mui-focused fieldset": { borderColor: "#ff9900" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#020202",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          "&.Mui-focused": { color: "#ff9900" },
                        },
                      }}
                    />
                  </div>

                  <FormControl className="flex flex-col gap-2">
                    <FormLabel
                      className="text-sm font-semibold text-[#020202]"
                      sx={{
                        color: "#020202",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        "&.Mui-focused": { color: "#020202" },
                      }}
                    >
                      Gender
                    </FormLabel>
                    <RadioGroup
                      row
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="flex flex-wrap gap-6 rounded-md border border-[#b1b1b1] bg-white px-10 py-3"
                    >
                      <FormControlLabel
                        value="male"
                        control={
                          <Radio
                            sx={{
                              color: "#b1b1b1",
                              "&.Mui-checked": { color: "#ff9900" },
                            }}
                          />
                        }
                        label="Male"
                        sx={{
                          "& .MuiFormControlLabel-label": {
                            fontSize: "1rem",
                            color: "rgba(2, 2, 2, 0.7)",
                          },
                        }}
                      />
                      <FormControlLabel
                        value="female"
                        control={
                          <Radio
                            sx={{
                              color: "#b1b1b1",
                              "&.Mui-checked": { color: "#ff9900" },
                            }}
                          />
                        }
                        label="Female"
                        sx={{
                          "& .MuiFormControlLabel-label": {
                            fontSize: "1rem",
                            color: "rgba(2, 2, 2, 0.7)",
                          },
                        }}
                      />
                      <FormControlLabel
                        value="other"
                        control={
                          <Radio
                            sx={{
                              color: "#b1b1b1",
                              "&.Mui-checked": { color: "#ff9900" },
                            }}
                          />
                        }
                        label="Other"
                        sx={{
                          "& .MuiFormControlLabel-label": {
                            fontSize: "1rem",
                            color: "rgba(2, 2, 2, 0.7)",
                          },
                        }}
                      />
                    </RadioGroup>
                  </FormControl>

                  <div className="flex flex-wrap gap-8">
                    <MuiTelInput
                      label="Phone (optional)"
                      placeholder="Optional"
                      value={phoneNumber}
                      onChange={(value) => setPhoneNumber(value)}
                      defaultCountry="PH"
                      className="flex-1"
                      style={{ minWidth: "300px" }}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "#b1b1b1" },
                          "&:hover fieldset": { borderColor: "#ff9900" },
                          "&.Mui-focused fieldset": { borderColor: "#ff9900" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#020202",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          "&.Mui-focused": { color: "#ff9900" },
                        },
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-8">
                    <TextField
                      label="Date of birth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="flex-1"
                      style={{ minWidth: "300px" }}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "#b1b1b1" },
                          "&:hover fieldset": { borderColor: "#ff9900" },
                          "&.Mui-focused fieldset": { borderColor: "#ff9900" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#020202",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          "&.Mui-focused": { color: "#ff9900" },
                        },
                      }}
                    />

                    <TextField
                      label="Country"
                      type="text"
                      placeholder="Pakistan"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="flex-1"
                      style={{ minWidth: "300px" }}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "#b1b1b1" },
                          "&:hover fieldset": { borderColor: "#ff9900" },
                          "&.Mui-focused fieldset": { borderColor: "#ff9900" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#020202",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          "&.Mui-focused": { color: "#ff9900" },
                        },
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-8">
                    <TextField
                      label="City"
                      type="text"
                      placeholder="Lahore"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="flex-1"
                      style={{ minWidth: "300px" }}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "#b1b1b1" },
                          "&:hover fieldset": { borderColor: "#ff9900" },
                          "&.Mui-focused fieldset": { borderColor: "#ff9900" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#020202",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          "&.Mui-focused": { color: "#ff9900" },
                        },
                      }}
                    />

                    <TextField
                      label="Zip code"
                      type="text"
                      placeholder="54000"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="flex-1"
                      style={{ minWidth: "300px" }}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "#b1b1b1" },
                          "&:hover fieldset": { borderColor: "#ff9900" },
                          "&.Mui-focused fieldset": { borderColor: "#ff9900" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#020202",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          "&.Mui-focused": { color: "#ff9900" },
                        },
                      }}
                    />
                  </div>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        sx={{
                          color: "#b1b1b1",
                          "&.Mui-checked": { color: "#ff9900" },
                        }}
                      />
                    }
                    label="I have read and accept Terms of Use, Privacy Policy, Terms & Conditions"
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "0.875rem",
                        color: "black",
                      },
                    }}
                  />

                  <div className="flex flex-col items-center gap-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      variant="contained"
                      colorScheme="primary"
                      className="w-[255px] bg-[#ff9900] px-10 py-3 text-lg font-semibold text-white shadow-[0_1px_5px_rgba(0,0,0,0.12),0_2px_2px_rgba(0,0,0,0.14),0_3px_1px_-2px_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-0.5 hover:bg-[#ff9900] disabled:hover:translate-y-0"
                    >
                      {isLoading ? "Signing up..." : "Sign Up"}
                    </Button>
                    <button
                      type="button"
                      className="text-sm font-normal text-[#020202] transition-colors hover:text-[#ff9900]"
                    >
                      Forgot Password
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-3">
                      <h2 className="text-3xl font-normal text-black">
                        Verify Your Email
                      </h2>
                      <p className="text-lg font-normal text-[#020202]/70">
                        Enter the verification code sent to {email}
                      </p>
                    </div>

                    <TextField
                      label="Verification Code"
                      type="text"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      required
                      fullWidth
                      variant="outlined"
                      inputProps={{
                        maxLength: 6,
                        style: {
                          textAlign: "center",
                          letterSpacing: "4px",
                          fontSize: "24px",
                          fontWeight: "bold",
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "#b1b1b1" },
                          "&:hover fieldset": { borderColor: "#ff9900" },
                          "&.Mui-focused fieldset": { borderColor: "#ff9900" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#020202",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          "&.Mui-focused": { color: "#ff9900" },
                        },
                      }}
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
                      {isLoading ? "Verifying..." : "Verify Code"}
                    </Button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isResending}
                      className="text-sm font-normal text-[#020202] transition-colors hover:text-[#ff9900] disabled:opacity-50"
                    >
                      {isResending ? "Resending..." : "Resend Code"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
