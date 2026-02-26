const express = require("express");
const router = express.Router();
const { verifySupabaseJwt } = require("../middleware/auth");
const { supabaseAdmin } = require("../lib/supabase");

// ─────────────────────────────────────────────────────────────────────────────
// requireAdminProfile — checks admin_profiles table (NOT active_persona)
// ─────────────────────────────────────────────────────────────────────────────
async function requireAdminProfile(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_profiles")
      .select("user_id, access_level, is_active")
      .eq("user_id", req.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(403).json({ error: { message: "Insufficient permissions" } });
    }
    req.adminProfile = data;
    next();
  } catch (err) {
    console.error("Admin auth error:", err);
    res.status(500).json({ error: { message: "Authorization check failed" } });
  }
}

const requireAdmin = [verifySupabaseJwt, requireAdminProfile];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/me — check if current user is an admin
// ─────────────────────────────────────────────────────────────────────────────
router.get("/me", verifySupabaseJwt, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_profiles")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// CONSULTANT APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/applications
 * List consultant applications (filterable by status)
 */
router.get("/applications", ...requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = supabaseAdmin
      .from("consultant_applications")
      .select(`
        *,
        applicant:profiles!consultant_applications_user_id_fkey(
          id, display_name, first_name, last_name, email,
          avatar_url, headline, is_consultant_verified, active_persona
        )
      `)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

/**
 * GET /api/admin/applications/:id
 * Full application detail + all vetting data
 */
router.get("/applications/:id", ...requireAdmin, async (req, res, next) => {
  try {
    const { data: application, error: appError } = await supabaseAdmin
      .from("consultant_applications")
      .select(`
        *,
        applicant:profiles!consultant_applications_user_id_fkey(
          id, display_name, first_name, last_name, email, avatar_url, headline,
          bio, phone_number, country, city, is_consultant_verified
        )
      `)
      .eq("id", req.params.id)
      .single();

    if (appError) throw appError;

    const userId = application.user_id;

    // Fetch full vetting data in parallel
    const [
      { data: skills },
      { data: languages },
      { data: educations },
      { data: certifications },
      { data: licenses },
      { data: experiences },
      { data: specializations },
      { data: identityDocs },
      { data: rateSettings },
      { data: portfolios },
    ] = await Promise.all([
      supabaseAdmin.from("user_skills").select("id,proficiency_level,skill:skills(id,name,category)").eq("user_id", userId),
      supabaseAdmin.from("user_languages").select("id,fluency_level,language:languages(id,name,code)").eq("user_id", userId),
      supabaseAdmin.from("user_educations").select("*").eq("user_id", userId),
      supabaseAdmin.from("user_certifications").select("*").eq("user_id", userId),
      supabaseAdmin.from("user_licenses").select("*").eq("user_id", userId),
      supabaseAdmin.from("user_experiences").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
      supabaseAdmin.from("user_specializations").select("*").eq("user_id", userId),
      supabaseAdmin.from("user_identity_documents").select("*").eq("user_id", userId),
      supabaseAdmin.from("user_rate_settings").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("user_portfolios").select("*").eq("user_id", userId).order("position"),
    ]);

    res.json({
      data: {
        ...application,
        vetting: {
          skills: skills ?? [],
          languages: languages ?? [],
          educations: educations ?? [],
          certifications: certifications ?? [],
          licenses: licenses ?? [],
          experiences: experiences ?? [],
          specializations: specializations ?? [],
          identity_documents: identityDocs ?? [],
          rate_settings: rateSettings ?? null,
          portfolios: portfolios ?? [],
        },
      },
    });
  } catch (error) { next(error); }
});

/**
 * POST /api/admin/applications/:id/approve
 */
router.post("/applications/:id/approve", ...requireAdmin, async (req, res, next) => {
  try {
    const { data: app, error: fetchError } = await supabaseAdmin
      .from("consultant_applications")
      .select("user_id")
      .eq("id", req.params.id)
      .single();
    if (fetchError) throw fetchError;

    // Update application
    const { error: appError } = await supabaseAdmin
      .from("consultant_applications")
      .update({ status: "approved", reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
      .eq("id", req.params.id);
    if (appError) throw appError;

    // Grant consultant verified status
    const { data, error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ is_consultant_verified: true })
      .eq("id", app.user_id)
      .select("id, display_name, is_consultant_verified")
      .single();
    if (profileError) throw profileError;

    res.json({ data });
  } catch (error) { next(error); }
});

/**
 * POST /api/admin/applications/:id/reject
 */
router.post("/applications/:id/reject", ...requireAdmin, async (req, res, next) => {
  try {
    const { rejection_reason } = req.body;
    const { data, error } = await supabaseAdmin
      .from("consultant_applications")
      .update({
        status: "rejected",
        rejection_reason: rejection_reason || null,
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/admins — list all admin_profiles
 */
router.get("/admins", ...requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_profiles")
      .select(`
        *,
        user:profiles(id, display_name, email, avatar_url)
      `)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

/**
 * POST /api/admin/admins/:userId/grant — grant admin access
 */
router.post("/admins/:userId/grant", ...requireAdmin, async (req, res, next) => {
  try {
    const { access_level = "support", department } = req.body;
    const { data, error } = await supabaseAdmin
      .from("admin_profiles")
      .upsert({
        user_id: req.params.userId,
        access_level,
        department: department || null,
        is_active: true,
      }, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (error) { next(error); }
});

/**
 * DELETE /api/admin/admins/:userId/revoke — revoke admin access
 */
router.delete("/admins/:userId/revoke", ...requireAdmin, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("admin_profiles")
      .update({ is_active: false })
      .eq("user_id", req.params.userId);
    if (error) throw error;
    res.status(204).send();
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// MATCH — Consultant Candidates for a Project
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/match-candidates?projectId=xxx
 * Returns ranked verified consultants matching the project's skills/niche
 */
router.get("/match-candidates", ...requireAdmin, async (req, res, next) => {
  try {
    const { projectId } = req.query;

    // Pull project details if projectId provided
    let projectSkills = [];
    let projectCategory = null;
    if (projectId) {
      const { data: project } = await supabaseAdmin
        .from("projects")
        .select("skills, category")
        .eq("id", projectId)
        .maybeSingle();
      if (project) {
        projectSkills = project.skills ?? [];
        projectCategory = project.category;
      }
    }

    // Query verified consultants with their rate settings and stats
    const { data: candidates, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        id, display_name, first_name, last_name, email, avatar_url, headline, bio,
        rate_settings:user_rate_settings(hourly_rate, currency, availability, weekly_hours),
        stats:user_stats(avg_rating, jobs_completed, on_time_rate),
        specializations:user_specializations(category, sub_category, years_of_experience),
        skills:user_skills(proficiency_level, skill:skills(name, category))
      `)
      .eq("is_consultant_verified", true)
      .not("active_persona", "is", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Score each candidate based on skill/niche overlap
    const scored = (candidates ?? []).map(c => {
      const rateSettings = Array.isArray(c.rate_settings) ? c.rate_settings[0] : c.rate_settings;
      const stats = Array.isArray(c.stats) ? c.stats[0] : c.stats;

      if (rateSettings?.availability === "unavailable") return null;

      let score = 0;
      // +2 per matching skill
      if (projectSkills.length > 0) {
        const candidateSkillNames = (c.skills ?? []).map(s => s.skill?.name?.toLowerCase());
        projectSkills.forEach(ps => {
          if (candidateSkillNames.includes(ps.toLowerCase())) score += 2;
        });
      }
      // +3 for niche match
      if (projectCategory) {
        const hasNiche = (c.specializations ?? []).some(sp =>
          sp.category?.toLowerCase() === projectCategory?.toLowerCase()
        );
        if (hasNiche) score += 3;
      }
      // +1 per completed job (up to 5)
      score += Math.min((stats?.jobs_completed ?? 0), 5);

      return { ...c, rate_settings: rateSettings, stats, match_score: score };
    }).filter(Boolean);

    scored.sort((a, b) => b.match_score - a.match_score);

    res.json({ data: scored });
  } catch (error) { next(error); }
});

/**
 * POST /api/admin/match-assign — assign consultant to project
 */
router.post("/match-assign", ...requireAdmin, async (req, res, next) => {
  try {
    const { project_id, consultant_id } = req.body;
    if (!project_id || !consultant_id) {
      return res.status(400).json({ error: { message: "project_id and consultant_id are required" } });
    }
    const { data, error } = await supabaseAdmin
      .from("projects")
      .update({ consultant_id, status: "active" })
      .eq("id", project_id)
      .select("id, title, status, consultant_id")
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/consultants/pending
 */
router.get("/consultants/pending", ...requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("is_consultant_verified", false)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

/**
 * POST /api/admin/consultants/:id/verify (legacy)
 */
router.post("/consultants/:id/verify", ...requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ is_consultant_verified: true })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

/**
 * GET /api/admin/consultants/:id/profile
 * Full profile snapshot for the match page side panel
 */
router.get("/consultants/:id/profile", ...requireAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;

    const [
      { data: profile, error: pErr },
      { data: skills },
      { data: languages },
      { data: educations },
      { data: certifications },
      { data: licenses },
      { data: experiences },
      { data: specializations },
      { data: portfolios },
      { data: rateSettings },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", userId).single(),
      supabaseAdmin.from("user_skills").select("id,proficiency_level,skill:skills(id,name,category)").eq("user_id", userId),
      supabaseAdmin.from("user_languages").select("id,fluency_level,language:languages(id,name,code)").eq("user_id", userId),
      supabaseAdmin.from("user_educations").select("*").eq("user_id", userId),
      supabaseAdmin.from("user_certifications").select("*").eq("user_id", userId),
      supabaseAdmin.from("user_licenses").select("*").eq("user_id", userId),
      supabaseAdmin.from("user_experiences").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
      supabaseAdmin.from("user_specializations").select("*").eq("user_id", userId),
      supabaseAdmin.from("user_portfolios").select("*").eq("user_id", userId).order("position"),
      supabaseAdmin.from("user_rate_settings").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    if (pErr) throw pErr;

    res.json({
      data: {
        ...profile,
        skills: skills ?? [],
        languages: languages ?? [],
        educations: educations ?? [],
        certifications: certifications ?? [],
        licenses: licenses ?? [],
        experiences: experiences ?? [],
        specializations: specializations ?? [],
        portfolios: portfolios ?? [],
        rate_settings: rateSettings ?? null,
      },
    });
  } catch (error) { next(error); }
});

/**
 * GET /api/admin/projects
 */
router.get("/projects", ...requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select(`*, client:profiles!projects_client_id_fkey(id,display_name,email), consultant:profiles!projects_consultant_id_fkey(id,display_name,email)`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

/**
 * GET /api/admin/users
 */
router.get("/users", ...requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (error) { next(error); }
});

module.exports = router;
