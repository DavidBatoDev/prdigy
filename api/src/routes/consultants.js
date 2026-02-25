const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../lib/supabase");

/**
 * GET /api/consultants
 * Fetch all verified consultants
 */
router.get("/", async (req, res) => {
  try {
    const { data: consultants, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, display_name, avatar_url, bio, is_consultant_verified, active_persona, first_name, last_name, country, city, skills, created_at"
      )
      .eq("is_consultant_verified", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching consultants:", error);
      return res.status(500).json({ error: { message: "Error fetching consultants" } });
    }

    res.json(consultants);
  } catch (error) {
    console.error("Error in GET /consultants:", error);
    res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

/**
 * GET /api/consultants/:id
 * Fetch a specific consultant by ID
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, display_name, avatar_url, bio, is_consultant_verified, active_persona, first_name, last_name, country, city, skills, created_at, phone_number, email"
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: { message: "Consultant not found" } });
      }
      return next(error);
    }

    // You can decide if you only want to return it if it's actually a verified consultant
    if (!profile.is_consultant_verified && profile.active_persona !== "consultant") {
      return res.status(404).json({ error: { message: "Consultant not found or not verified" } });
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
