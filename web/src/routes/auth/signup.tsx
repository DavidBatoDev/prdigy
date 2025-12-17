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

export const Route = createFileRoute("/auth/signup")({
  component: RouteComponent,
});

function RouteComponent() {
  const signUp = useAuthStore((state) => state.signUp);
  const toast = useToast();
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
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const assets = useMemo(
    () => ({
      ellipse28:
        "https://www.figma.com/api/mcp/asset/40e62b5c-fc97-410f-b33c-d2e8283b208d",
      ellipse29:
        "https://www.figma.com/api/mcp/asset/01ff7abc-8e87-4c32-9f9b-5a384b30af5d",
      accent:
        "https://www.figma.com/api/mcp/asset/1a713252-c509-4cef-8a26-4ab7db43b0cb",
    }),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      await signUp(email, password);

      // Update profile with additional fields
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          await supabase
            .from("profiles")
            .update({
              first_name: firstName,
              last_name: lastName,
              display_name: `${firstName} ${lastName}`,
              gender: gender || null,
              phone_number: phoneNumber || null,
              country: country || null,
              date_of_birth: dateOfBirth || null,
              city: city || null,
              zip_code: zipCode || null,
            })
            .eq("id", authData.user.id);
        }
      } catch (profileError) {
        console.error("Error updating profile:", profileError);
      }

      // Send welcome email via Edge Function
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(
          `${supabaseUrl}/functions/v1/send-signup-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: email,
              firstName,
              lastName,
            }),
          }
        );

        if (!response.ok) {
          console.error("Failed to send welcome email:", await response.text());
          // Don't fail signup if email fails
        }
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Don't fail signup if email fails
      }

      setSuccess(true);
      toast.success(
        "Signup successful! Check your email to confirm your account."
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
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
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff9900] text-2xl font-medium text-white">
              1
            </div>
            <div className="h-px flex-1 bg-[#d4d4d4]" />
            <div className="h-8 w-8 rounded-full border-2 border-[#d4d4d4] bg-white" />
            <div className="h-px flex-1 bg-[#d4d4d4]" />
            <div className="h-8 w-8 rounded-full border-2 border-[#d4d4d4] bg-white" />
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
              <TextField
                label="Email"
                type="email"
                placeholder="abc123@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
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
                  label="Phone no"
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
