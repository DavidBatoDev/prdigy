const express = require("express");
const router = express.Router();
const { verifySupabaseJwt } = require("../middleware/auth");
const { supabaseAdmin } = require("../lib/supabase");

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get("/me", verifySupabaseJwt, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/users/me
 * Update current user profile
 */
router.patch("/me", verifySupabaseJwt, async (req, res, next) => {
  try {
    const { display_name, bio, avatar_url } = req.body;

    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:id
 * Get user profile by ID
 */
router.get("/:id", verifySupabaseJwt, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url, bio, is_consultant_verified")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: { message: "User not found" } });
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
