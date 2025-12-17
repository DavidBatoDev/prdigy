// @ts-expect-error
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error
import { encode as base64UrlEncode } from "https://deno.land/std@0.168.0/encoding/base64url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  firstName: string;
  lastName: string;
  verificationCode: string;
}

// Gmail API token refresh helper
async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Send email via Gmail API
async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  htmlBody: string
) {
  const fromEmail = "batobatodavid20@gmail.com"; // Your Gmail address
  const fromName = "Prodigitality Services";

  // Construct the email in RFC 2822 format
  const email = [
    `From: ${fromName} <${fromEmail}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    htmlBody,
  ].join("\r\n");

  // Base64url encode using UTF-8 bytes to allow non-Latin characters
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
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${error}`);
  }

  return await response.json();
}

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email template
function getVerificationEmailHtml(
  firstName: string,
  verificationCode: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #f3f4f6;">
                    <h1 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: 600;">Verify Your Email</h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Hello ${firstName},
                    </p>
                    
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Thank you for signing up for Prodigitality. To complete your registration, please enter the verification code below:
                    </p>
                    
                    <!-- Verification Code -->
                    <div style="margin: 32px 0; text-align: center; padding: 24px; background-color: #f3f4f6; border-radius: 8px;">
                      <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                        Your Verification Code
                      </p>
                      <p style="margin: 0; color: #1f2937; font-size: 32px; font-weight: 700; letter-spacing: 4px;">
                        ${verificationCode}
                      </p>
                    </div>
                    
                    <p style="margin: 24px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      This code will expire in 10 minutes.
                    </p>
                    
                    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      If you didn't create this account, please disregard this email.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; border-top: 1px solid #f3f4f6; text-align: center;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                      Prodigitality Services
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      You're receiving this email because you recently created a Prodigitality account.
                    </p>
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

// Main server function
// @ts-ignore
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, firstName, lastName, verificationCode }: EmailRequest =
      await req.json();

    if (!to || !firstName || !lastName || !verificationCode) {
      throw new Error(
        "Missing required fields: to, firstName, lastName, verificationCode"
      );
    }

    // Get Google OAuth credentials from environment
    // @ts-ignore
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    // @ts-ignore
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    // @ts-ignore
    const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error("Missing Google OAuth credentials");
    }

    // Refresh access token
    const accessToken = await refreshAccessToken(
      clientId,
      clientSecret,
      refreshToken
    );

    // Send verification email
    const htmlBody = getVerificationEmailHtml(firstName, verificationCode);
    await sendEmail(
      accessToken,
      to,
      "Verify Your Email Address - Code: " + verificationCode,
      htmlBody
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Verification email sent successfully",
        verificationCode: verificationCode,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
