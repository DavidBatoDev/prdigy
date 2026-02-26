/**
 * /api/applications — Consultant-facing application routes
 */
const express = require("express");
const router = express.Router();
const { verifySupabaseJwt } = require("../middleware/auth");
const { supabaseAdmin } = require("../lib/supabase");
const rateLimit = require("express-rate-limit");

const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applications/me — fetch current user's application (or null)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/me", verifySupabaseJwt, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("consultant_applications")
      .select("*")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applications — create or upsert a draft
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const allowed = [
      "cover_letter", "years_of_experience", "primary_niche",
      "linkedin_url", "website_url", "why_join"
    ];
    const payload = { user_id: req.user.id, status: "draft" };
    for (const key of allowed) {
      if (key in req.body) payload[key] = req.body[key];
    }

    const { data, error } = await supabaseAdmin
      .from("consultant_applications")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applications/submit — finalise and submit
// ─────────────────────────────────────────────────────────────────────────────
router.post("/submit", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    // Fetch the draft first to validate
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("consultant_applications")
      .select("*")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return res.status(404).json({ error: { message: "No application found. Save a draft first." } });
    }
    if (existing.status === "submitted" || existing.status === "under_review" || existing.status === "approved") {
      return res.status(400).json({ error: { message: `Application is already ${existing.status}.` } });
    }
    if (!existing.cover_letter || !existing.years_of_experience) {
      return res.status(422).json({ error: { message: "Please complete the required fields before submitting." } });
    }

    const { data, error } = await supabaseAdmin
      .from("consultant_applications")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

module.exports = router;
