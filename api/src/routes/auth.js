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
 * PATCH /api/auth/persona
 * Switch active persona
 */
router.patch("/persona", verifySupabaseJwt, async (req, res, next) => {
  try {
    const { active_persona } = req.body;

    const validPersonas = ["client", "freelancer", "consultant", "admin"];
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

module.exports = router;
