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
    "Add them then re-run. Provided values can be copied into .env:"
  );
  console.error("GOOGLE_CLIENT_ID=<your client id>");
  console.error("GOOGLE_CLIENT_SECRET=<your client secret>");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Gmail scopes for full access: read, compose, send, draft, modify, delete
const scopes = [
  "https://www.googleapis.com/auth/gmail.modify", // Read, compose, send, and delete emails
  "https://www.googleapis.com/auth/gmail.compose", // Create drafts and send emails
  "https://www.googleapis.com/auth/gmail.readonly", // Read emails and settings
  "https://www.googleapis.com/auth/gmail.send", // Send emails on behalf of user
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline", // ensures refresh_token is returned on first consent
  prompt: "consent", // always prompt to guarantee refresh_token
  scope: scopes,
});

console.log("\nAuthorize this app by visiting the URL:\n");
console.log(authUrl);
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
        "No refresh_token returned. Ensure you used prompt=consent and access_type=offline and that this is the first consent."
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
