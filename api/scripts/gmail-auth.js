// Gmail OAuth helper: starts a local callback server, prints .env keys
// Usage: npm run gmail:auth

const express = require("express");
const { google } = require("googleapis");
const dotenv = require("dotenv");

dotenv.config({ path: require("path").join(__dirname, "../.env") });

const PORT = process.env.GOOGLE_OAUTH_PORT || 8000;
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/oauth2callback`;

const CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env");
  console.error(
    "Add them then re-run. Provided values can be copied into .env:",
  );
  console.error("GOOGLE_CLIENT_ID=<your client id>");
  console.error("GOOGLE_CLIENT_SECRET=<your client secret>");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

// Keep scope as small as possible for long-term token stability
const scopes = ["https://www.googleapis.com/auth/gmail.send"];

// Only force consent when intentionally rotating/regenerating refresh token.
// Set GOOGLE_OAUTH_FORCE_CONSENT=true for that one run.
const forceConsent = process.env.GOOGLE_OAUTH_FORCE_CONSENT === "true";

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline", // required to receive refresh_token
  include_granted_scopes: true,
  prompt: forceConsent ? "consent" : undefined,
  scope: scopes,
});

console.log("\nAuthorize this app by visiting the URL:\n");
console.log(authUrl);
console.log(
  `\nMode: ${forceConsent ? "FORCE_CONSENT (token rotation)" : "NORMAL (reuse existing grant)"}`,
);
console.log("\nWaiting for approval... (Ctrl+C to cancel)\n");

const app = express();

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    res.status(400).send("Missing code parameter");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      console.warn(
        "No refresh_token returned. Re-run with GOOGLE_OAUTH_FORCE_CONSENT=true to rotate and issue a new refresh token.",
      );
    }

    // Log .env keys for easy copy-paste
    console.log("\nAdd these to your .env:\n");
    console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_REDIRECT_URI=${REDIRECT_URI}`);
    if (refreshToken) {
      console.log(`GOOGLE_REFRESH_TOKEN=${refreshToken}`);
    }

    res.send("Authorization complete. You can close this tab.");
  } catch (err) {
    console.error("Failed to exchange code:", err.message);
    res.status(500).send("Failed to exchange code. Check server logs.");
  } finally {
    // Close server shortly after to finish CLI flow
    setTimeout(() => process.exit(0), 300);
  }
});

app.listen(PORT, () => {
  console.log(`Callback server listening on http://localhost:${PORT}`);
});
