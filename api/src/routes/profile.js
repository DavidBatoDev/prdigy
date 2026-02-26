const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { verifySupabaseJwt } = require("../middleware/auth");
const { supabaseAdmin } = require("../lib/supabase");

const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests. Please try again later.",
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests. Please try again later.",
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile/meta/skills — all skills for skill picker dropdown
// Must be before /:id to avoid Express matching 'meta' as an :id param
// ─────────────────────────────────────────────────────────────────────────────
router.get("/meta/skills", verifySupabaseJwt, readLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("skills")
      .select("id,name,category,slug")
      .order("name");
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile/meta/languages — all languages for language picker
// ─────────────────────────────────────────────────────────────────────────────
router.get("/meta/languages", verifySupabaseJwt, readLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("languages")
      .select("id,name,code")
      .order("name");
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile/:id — full profile with all vetting tables
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:id", verifySupabaseJwt, readLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;

    const [
      { data: profile, error: profileError },
      { data: skills, error: skillsError },
      { data: languages, error: languagesError },
      { data: educations, error: educationsError },
      { data: certifications, error: certificationsError },
      { data: licenses, error: licensesError },
      { data: experiences, error: experiencesError },
      { data: portfolios, error: portfoliosError },
      { data: stats, error: statsError },
      { data: specializations, error: specializationsError },
      { data: rateSettings, error: rateSettingsError },
      { data: identityDocuments, error: idDocsError },
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id,email,display_name,first_name,last_name,avatar_url,banner_url,bio,headline,phone_number,country,city,zip_code,gender,date_of_birth,is_consultant_verified,active_persona,created_at,updated_at")
        .eq("id", id)
        .single(),
      supabaseAdmin
        .from("user_skills")
        .select("id,proficiency_level,years_experience,skill:skills(id,name,category)")
        .eq("user_id", id)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("user_languages")
        .select("id,fluency_level,language:languages(id,name,code)")
        .eq("user_id", id),
      supabaseAdmin
        .from("user_educations")
        .select("*")
        .eq("user_id", id)
        .order("start_year", { ascending: false, nullsFirst: false }),
      supabaseAdmin
        .from("user_certifications")
        .select("*")
        .eq("user_id", id)
        .order("issue_date", { ascending: false, nullsFirst: false }),
      supabaseAdmin
        .from("user_licenses")
        .select("*")
        .eq("user_id", id),
      supabaseAdmin
        .from("user_experiences")
        .select("*")
        .eq("user_id", id)
        .order("start_date", { ascending: false }),
      supabaseAdmin
        .from("user_portfolios")
        .select("*")
        .eq("user_id", id)
        .order("position", { ascending: true }),
      supabaseAdmin
        .from("user_stats")
        .select("*")
        .eq("user_id", id)
        .maybeSingle(),
      supabaseAdmin
        .from("user_specializations")
        .select("*")
        .eq("user_id", id),
      supabaseAdmin
        .from("user_rate_settings")
        .select("*")
        .eq("user_id", id)
        .maybeSingle(),
      supabaseAdmin
        .from("user_identity_documents")
        .select("*")
        .eq("user_id", id),
    ]);

    if (profileError) throw profileError;
    if (!profile) return res.status(404).json({ error: { message: "Profile not found" } });

    res.json({
      data: {
        ...profile,
        skills: skills ?? [],
        languages: languages ?? [],
        educations: educations ?? [],
        certifications: certifications ?? [],
        licenses: licenses ?? [],
        experiences: experiences ?? [],
        portfolios: portfolios ?? [],
        stats: stats ?? null,
        specializations: specializations ?? [],
        rate_settings: rateSettings ?? null,
        identity_documents: identityDocuments ?? [],
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/profile — update core profile fields
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const allowed = [
      "bio", "headline",
      "phone_number", "country", "city", "zip_code",
      "gender", "date_of_birth",
      // avatar_url and banner_url are managed via /api/uploads/*
    ];
    const updates = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// USER SKILLS
// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/profile/skills — replace full skill list
router.put("/skills", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skills } = req.body; // [{ skill_id, proficiency_level, years_experience? }]

    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: { message: "skills must be an array" } });
    }

    // Delete all, then re-insert (simplest approach for a full replace)
    await supabaseAdmin.from("user_skills").delete().eq("user_id", userId);

    if (skills.length > 0) {
      const rows = skills.map((s) => ({
        user_id: userId,
        skill_id: s.skill_id,
        proficiency_level: s.proficiency_level ?? "intermediate",
        years_experience: s.years_experience ?? null,
      }));
      const { error } = await supabaseAdmin.from("user_skills").insert(rows);
      if (error) throw error;
    }

    const { data } = await supabaseAdmin
      .from("user_skills")
      .select("id,proficiency_level,years_experience,skill:skills(id,name,category)")
      .eq("user_id", userId);

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// USER LANGUAGES
// ─────────────────────────────────────────────────────────────────────────────
router.post("/languages", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_languages")
      .insert({ ...req.body, user_id: req.user.id })
      .select("id,fluency_level,language:languages(id,name,code)")
      .single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (error) { next(error); }
});

router.patch("/languages/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_languages")
      .update(req.body)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select("id,fluency_level,language:languages(id,name,code)")
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

router.delete("/languages/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("user_languages")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// EDUCATIONS
// ─────────────────────────────────────────────────────────────────────────────
router.post("/educations", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_educations")
      .insert({ ...req.body, user_id: req.user.id })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (error) { next(error); }
});

router.patch("/educations/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_educations")
      .update(req.body)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

router.delete("/educations/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("user_educations")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
router.post("/certifications", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_certifications")
      .insert({ ...req.body, user_id: req.user.id })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (error) { next(error); }
});

router.patch("/certifications/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_certifications")
      .update(req.body)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

router.delete("/certifications/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("user_certifications")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIENCES
// ─────────────────────────────────────────────────────────────────────────────
router.post("/experiences", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_experiences")
      .insert({ ...req.body, user_id: req.user.id })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (error) { next(error); }
});

router.patch("/experiences/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_experiences")
      .update(req.body)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

router.delete("/experiences/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("user_experiences")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIOS
// ─────────────────────────────────────────────────────────────────────────────
router.post("/portfolios", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_portfolios")
      .insert({ ...req.body, user_id: req.user.id })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (error) { next(error); }
});

router.patch("/portfolios/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_portfolios")
      .update(req.body)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

router.delete("/portfolios/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("user_portfolios")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// RATE SETTINGS (upsert — one row per user)
// ─────────────────────────────────────────────────────────────────────────────
router.put("/rate-settings", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const allowed = ["hourly_rate","currency","min_project_budget","availability","weekly_hours"];
    const updates = { user_id: userId };
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const { data, error } = await supabaseAdmin
      .from("user_rate_settings")
      .upsert(updates, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LICENSES
// ─────────────────────────────────────────────────────────────────────────────
router.post("/licenses", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_licenses")
      .insert({ ...req.body, user_id: req.user.id })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (error) { next(error); }
});

router.patch("/licenses/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_licenses")
      .update(req.body)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

router.delete("/licenses/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("user_licenses")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALIZATIONS
// ─────────────────────────────────────────────────────────────────────────────
router.post("/specializations", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_specializations")
      .insert({ ...req.body, user_id: req.user.id })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (error) { next(error); }
});

router.patch("/specializations/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_specializations")
      .update(req.body)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

router.delete("/specializations/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("user_specializations")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// IDENTITY DOCUMENTS
// ─────────────────────────────────────────────────────────────────────────────
router.post("/identity_documents", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_identity_documents")
      .insert({ ...req.body, user_id: req.user.id })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (error) { next(error); }
});

router.delete("/identity_documents/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("user_identity_documents")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) { next(error); }
});

module.exports = router;
