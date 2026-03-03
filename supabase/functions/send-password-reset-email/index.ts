// @ts-expect-error
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error
import { encode as base64UrlEncode } from "https://deno.land/std@0.168.0/encoding/base64url.ts";
// @ts-expect-error
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetEmailRequest {
  email: string;
}

type EmailErrorCode =
  | "BAD_REQUEST"
  | "SERVER_CONFIG_ERROR"
  | "EMAIL_AUTH_INVALID"
  | "EMAIL_AUTH_REQUEST_FAILED"
  | "EMAIL_SEND_FAILED"
  | "EMAIL_INTERNAL";

class EmailFunctionError extends Error {
  code: EmailErrorCode;
  stage: string;
  httpStatus: number;
  details?: Record<string, unknown>;

  constructor(
    code: EmailErrorCode,
    message: string,
    stage: string,
    httpStatus: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "EmailFunctionError";
    this.code = code;
    this.stage = stage;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

function safeJsonParse(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Gmail API token refresh helper (reused from signup email pattern)
async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string> {
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  let response: Response;
  try {
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (error) {
    throw new EmailFunctionError(
      "EMAIL_AUTH_REQUEST_FAILED",
      "Failed to reach Google OAuth token endpoint",
      "refresh_access_token",
      500,
      { cause: error instanceof Error ? error.message : String(error) },
    );
  }

  const responseText = await response.text();
  const parsed = safeJsonParse(responseText);
  const oauthError = typeof parsed?.error === "string" ? parsed.error : null;
  const oauthErrorDescription =
    typeof parsed?.error_description === "string"
      ? parsed.error_description
      : null;

  if (!response.ok) {
    if (oauthError === "invalid_grant") {
      throw new EmailFunctionError(
        "EMAIL_AUTH_INVALID",
        "Google OAuth refresh token is invalid or revoked",
        "refresh_access_token",
        500,
        {
          status: response.status,
          oauthError,
          oauthErrorDescription,
        },
      );
    }

    throw new EmailFunctionError(
      "EMAIL_AUTH_REQUEST_FAILED",
      "Google OAuth token refresh request failed",
      "refresh_access_token",
      500,
      {
        status: response.status,
        oauthError,
        oauthErrorDescription,
      },
    );
  }

  const accessToken =
    typeof parsed?.access_token === "string" ? parsed.access_token : null;
  if (!accessToken) {
    throw new EmailFunctionError(
      "EMAIL_AUTH_REQUEST_FAILED",
      "Google OAuth token response missing access_token",
      "refresh_access_token",
      500,
    );
  }

  return accessToken;
}

// Send email via Gmail API
async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  htmlBody: string,
) {
  const fromEmail = "batobatodavid20@gmail.com"; // Your Gmail address
  const fromName = "Prodigitality Services";

  const email = [
    `From: ${fromName} <${fromEmail}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    htmlBody,
  ].join("\r\n");

  const emailBytes = new TextEncoder().encode(email);
  const encodedEmail = base64UrlEncode(emailBytes);

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedEmail }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    const parsed = safeJsonParse(errorText);
    const gmailMessage =
      typeof parsed?.error === "object" &&
      parsed.error &&
      typeof (parsed.error as Record<string, unknown>).message === "string"
        ? ((parsed.error as Record<string, unknown>).message as string)
        : null;

    if (response.status === 401 || response.status === 403) {
      throw new EmailFunctionError(
        "EMAIL_AUTH_INVALID",
        "Gmail authorization failed while sending email",
        "send_gmail_message",
        500,
        {
          status: response.status,
          gmailMessage,
        },
      );
    }

    throw new EmailFunctionError(
      "EMAIL_SEND_FAILED",
      "Gmail API rejected email send request",
      "send_gmail_message",
      500,
      {
        status: response.status,
        gmailMessage,
      },
    );
  }

  return await response.json();
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

function randomSalt(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getResetEmailHtml(code: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding:40px 40px 30px;text-align:center;border-bottom:1px solid #f3f4f6;">
                    <h1 style="margin:0;color:#1f2937;font-size:24px;font-weight:600;">Reset Your Password</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
                      Use the verification code below to reset your password:
                    </p>
                    <div style="margin:32px 0;text-align:center;padding:24px;background-color:#f3f4f6;border-radius:8px;">
                      <p style="margin:0 0 12px;color:#6b7280;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Your Verification Code</p>
                      <p style="margin:0;color:#1f2937;font-size:32px;font-weight:700;letter-spacing:4px;">${code}</p>
                    </div>
                    <p style="margin:24px 0;color:#6b7280;font-size:14px;line-height:1.6;">This code will expire in 10 minutes.</p>
                    <p style="margin:24px 0 0;color:#6b7280;font-size:14px;line-height:1.6;">If you didn't request a password reset, you can ignore this email.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Prodigitality Services</p>
                    <p style="margin:0;color:#9ca3af;font-size:12px;">You are receiving this email because a password reset was requested.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// @ts-ignore
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: ResetEmailRequest = await req.json();
    if (!email || typeof email !== "string") {
      throw new EmailFunctionError(
        "BAD_REQUEST",
        "Missing or invalid 'email'",
        "validate_request",
        400,
      );
    }

    // Env
    // @ts-ignore
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    // @ts-ignore
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    // @ts-ignore
    const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");
    // @ts-ignore
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!clientId || !clientSecret || !refreshToken) {
      throw new EmailFunctionError(
        "SERVER_CONFIG_ERROR",
        "Missing Google OAuth credentials",
        "load_env",
        500,
      );
    }
    if (!supabaseUrl || !serviceRoleKey) {
      throw new EmailFunctionError(
        "SERVER_CONFIG_ERROR",
        "Missing Supabase service credentials",
        "load_env",
        500,
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const code = generateVerificationCode();
    const salt = randomSalt(16);
    const codeHash = await sha256Hex(`${salt}|${code}`);

    // Insert reset row
    const { error: insertError } = await supabase
      .from("password_resets")
      .insert({
        email,
        user_id: null,
        code_hash: codeHash,
        salt,
        // expires_at defaults to now()+10m
      });
    if (insertError) {
      throw new EmailFunctionError(
        "EMAIL_INTERNAL",
        "Failed to persist password reset code",
        "insert_password_reset",
        500,
        {
          dbCode: (insertError as { code?: string }).code ?? null,
          dbMessage: insertError.message,
        },
      );
    }

    // Send email
    const accessToken = await refreshAccessToken(
      clientId,
      clientSecret,
      refreshToken,
    );
    const htmlBody = getResetEmailHtml(code);
    await sendEmail(
      accessToken,
      email,
      `Reset Your Password - Code: ${code}`,
      htmlBody,
    );

    return new Response(
      JSON.stringify({ success: true, message: "Password reset code sent" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const handledError =
      error instanceof EmailFunctionError
        ? error
        : new EmailFunctionError(
            "EMAIL_INTERNAL",
            "Unexpected error in send-password-reset-email",
            "unknown",
            500,
            {
              cause: error instanceof Error ? error.message : String(error),
            },
          );

    console.error(
      "send-password-reset-email failed",
      JSON.stringify({
        code: handledError.code,
        stage: handledError.stage,
        message: handledError.message,
        details: handledError.details ?? null,
      }),
    );

    return new Response(
      JSON.stringify({
        success: false,
        error: handledError.message,
        errorCode: handledError.code,
        errorStage: handledError.stage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: handledError.httpStatus,
      },
    );
  }
});
