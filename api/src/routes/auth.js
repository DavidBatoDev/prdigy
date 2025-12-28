const express = require("express");
const router = express.Router();
const { verifySupabaseJwt } = require("../middleware/auth");
const { supabaseAdmin } = require("../lib/supabase");

/**
 * POST /api/auth/onboarding
 * Set user's initial persona after registration
 */
router.post("/onboarding", verifySupabaseJwt, async (req, res, next) => {
  try {
    const { active_persona, display_name } = req.body;

    if (!active_persona || !["client", "freelancer"].includes(active_persona)) {
      return res.status(400).json({
        error: { message: 'Invalid persona. Must be "client" or "freelancer"' },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        active_persona,
        display_name: display_name || req.user.email.split("@")[0],
      })
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
 * PATCH /api/auth/onboarding/complete
 * Complete onboarding flow and set user's intent (freelancer/client/both)
 */
router.patch(
  "/onboarding/complete",
  verifySupabaseJwt,
  async (req, res, next) => {
    try {
      const { intent } = req.body;

      // Validate intent object
      if (!intent || typeof intent !== "object") {
        return res.status(400).json({
          error: { message: "Intent object is required" },
        });
      }

      if (
        typeof intent.freelancer !== "boolean" ||
        typeof intent.client !== "boolean"
      ) {
        return res.status(400).json({
          error: {
            message: "Intent must contain freelancer and client as booleans",
          },
        });
      }

      if (!intent.freelancer && !intent.client) {
        return res.status(400).json({
          error: {
            message: "At least one intent (freelancer or client) must be true",
          },
        });
      }

      // Build settings object with onboarding data
      const settings = {
        onboarding: {
          intent: {
            freelancer: intent.freelancer,
            client: intent.client,
          },
          completed_at: new Date().toISOString(),
        },
      };

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update({
          settings,
          has_completed_onboarding: true,
        })
        .eq("id", req.user.id)
        .select()
        .single();

      if (error) throw error;

      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/auth/persona
 * Switch active persona
 */
router.patch("/persona", verifySupabaseJwt, async (req, res, next) => {
  try {
    const { active_persona } = req.body;

    const validPersonas = ["client", "freelancer", "consultant"];
    if (!validPersonas.includes(active_persona)) {
      return res.status(400).json({
        error: {
          message: `Invalid persona. Must be one of: ${validPersonas.join(
            ", "
          )}`,
        },
      });
    }

    // Check if user can switch to consultant persona
    if (active_persona === "consultant") {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("is_consultant_verified")
        .eq("id", req.user.id)
        .single();

      if (!profile?.is_consultant_verified) {
        return res.status(403).json({
          error: {
            message: "You must be verified as a consultant to use this persona",
          },
        });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ active_persona })
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
 * GET /api/auth/profile
 * Get current user's profile
 */
router.get("/profile", verifySupabaseJwt, async (req, res, next) => {
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
 * PATCH /api/auth/profile
 * Update user profile
 */
router.patch("/profile", verifySupabaseJwt, async (req, res, next) => {
  try {
    const { display_name, avatar_url, bio } = req.body;

    // Only allow updating specific fields
    const updateData = {};
    if (display_name !== undefined) updateData.display_name = display_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (bio !== undefined) updateData.bio = bio;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: { message: "No valid fields to update" },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
