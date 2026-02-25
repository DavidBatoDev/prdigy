const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { verifySupabaseJwt } = require("../middleware/auth");
const { supabaseAdmin } = require("../lib/supabase");

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many upload requests. Please try again later.",
});

// Allowed buckets and their constraints
const BUCKET_CONFIG = {
  avatars: {
    maxSizeBytes: 5 * 1024 * 1024,    // 5 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  banners: {
    maxSizeBytes: 10 * 1024 * 1024,   // 10 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  portfolio_projects: {
    maxSizeBytes: 20 * 1024 * 1024,   // 20 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/uploads/signed-url
// Body: { bucket: "avatars"|"banners", contentType: "image/jpeg", fileName?: string }
// Returns: { signedUrl, path, publicUrl }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/signed-url", verifySupabaseJwt, uploadLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bucket, contentType, fileName } = req.body;

    if (!bucket || !BUCKET_CONFIG[bucket]) {
      return res.status(400).json({
        error: { message: `Invalid bucket. Allowed: ${Object.keys(BUCKET_CONFIG).join(", ")}` },
      });
    }

    const config = BUCKET_CONFIG[bucket];

    if (!contentType || !config.allowedMimeTypes.includes(contentType)) {
      return res.status(400).json({
        error: {
          message: `Invalid content type. Allowed: ${config.allowedMimeTypes.join(", ")}`,
        },
      });
    }

    // Build storage path: <bucket>/<userId>/<timestamp>.<ext>
    const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const safeName = fileName
      ? fileName.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64)
      : `${Date.now()}.${ext}`;
    const path = `${userId}/${safeName}`;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(path, { upsert: true });

    if (error) throw error;

    // Derive the public URL
    const { data: pubData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);

    res.json({
      data: {
        signedUrl: data.signedUrl,
        token: data.token,
        path,
        publicUrl: pubData.publicUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/uploads/confirm-avatar
// Body: { publicUrl: string }
// Updates profiles.avatar_url for the authenticated user
// ─────────────────────────────────────────────────────────────────────────────
router.post("/confirm-avatar", verifySupabaseJwt, uploadLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { publicUrl } = req.body;

    if (!publicUrl || typeof publicUrl !== "string") {
      return res.status(400).json({ error: { message: "publicUrl is required" } });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId)
      .select("id,avatar_url")
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/uploads/confirm-banner
// Body: { publicUrl: string }
// Updates profiles.banner_url for the authenticated user
// ─────────────────────────────────────────────────────────────────────────────
router.post("/confirm-banner", verifySupabaseJwt, uploadLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { publicUrl } = req.body;

    if (!publicUrl || typeof publicUrl !== "string") {
      return res.status(400).json({ error: { message: "publicUrl is required" } });
    }

    console.log(`[uploads] confirm-banner: userId=${userId}, publicUrl=${publicUrl}`);

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ banner_url: publicUrl })
      .eq("id", userId)
      .select("id,banner_url")
      .single();

    if (error) {
      console.error("[uploads] confirm-banner Supabase error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    console.log(`[uploads] confirm-banner success: banner_url=${data.banner_url}`);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/uploads/avatar — remove avatar from storage + clear DB field
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/avatar", verifySupabaseJwt, uploadLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get current avatar path
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (profile?.avatar_url) {
      // Extract path from public URL (everything after /avatars/)
      const match = profile.avatar_url.match(/\/avatars\/(.+)$/);
      if (match) {
        await supabaseAdmin.storage.from("avatars").remove([match[1]]);
      }
    }

    await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
