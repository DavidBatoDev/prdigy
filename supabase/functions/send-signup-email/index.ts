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

// Generate verification token
function generateVerificationToken(email: string): string {
  const timestamp = Date.now().toString();
  const data = email + timestamp;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Email template
function getVerificationEmailHtml(
  firstName: string,
  email: string,
  verificationCode: string
): string {
  const verificationUrl = `http://localhost:3000/auth/verify?email=${encodeURIComponent(
    email
  )}&code=${verificationCode}`;

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
                      Thank you for signing up for Prodigitality. To complete your registration and gain access to your account, please verify your email address by clicking the button below.
                    </p>
                    
                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin: 32px auto; display: table;">
                      <tr>
                        <td align="center" style="background-color: #ff9900; border-radius: 6px; padding: 12px 32px;">
                          <a href="${verificationUrl}" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 32px 0 24px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      If you didn't create this account, please disregard this email.
                    </p>
                    
                    <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                      This verification link will expire in 24 hours.
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
    const { to, firstName, lastName }: EmailRequest = await req.json();

    if (!to || !firstName || !lastName) {
      throw new Error("Missing required fields: to, firstName, lastName");
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
    const verificationCode = generateVerificationToken(to);
    const htmlBody = getVerificationEmailHtml(firstName, to, verificationCode);
    await sendEmail(accessToken, to, "Verify Your Email Address", htmlBody);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome email sent successfully",
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
