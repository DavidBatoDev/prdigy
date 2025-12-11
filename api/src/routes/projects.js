const express = require("express");
const router = express.Router();
const { verifySupabaseJwt, requirePersona } = require("../middleware/auth");
const { supabaseAdmin } = require("../lib/supabase");

/**
 * GET /api/projects
 * Get all projects for the current user
 */
router.get("/", verifySupabaseJwt, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("project_members")
      .select(
        `
        project:projects (
          id,
          title,
          brief,
          status,
          created_at,
          client:profiles!projects_client_id_fkey (
            id,
            display_name,
            avatar_url
          ),
          consultant:profiles!projects_consultant_id_fkey (
            id,
            display_name,
            avatar_url
          )
        )
      `
      )
      .eq("user_id", req.user.id);

    if (error) throw error;

    const projects = data.map((item) => item.project);
    res.json({ data: projects });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects
 * Create a new project (Client persona only)
 */
router.post(
  "/",
  verifySupabaseJwt,
  requirePersona("client"),
  async (req, res, next) => {
    try {
      const { title, brief } = req.body;

      if (!title) {
        return res
          .status(400)
          .json({ error: { message: "Title is required" } });
      }

      // Create project
      const { data: project, error: projectError } = await supabaseAdmin
        .from("projects")
        .insert({
          title,
          brief,
          client_id: req.user.id,
          status: "draft",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Add client as project member
      const { error: memberError } = await supabaseAdmin
        .from("project_members")
        .insert({
          project_id: project.id,
          user_id: req.user.id,
          role: "client",
        });

      if (memberError) throw memberError;

      res.status(201).json({ data: project });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/projects/:id
 * Get a single project by ID
 */
router.get("/:id", verifySupabaseJwt, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select(
        `
        *,
        client:profiles!projects_client_id_fkey (
          id,
          display_name,
          avatar_url,
          email
        ),
        consultant:profiles!projects_consultant_id_fkey (
          id,
          display_name,
          avatar_url,
          email
        ),
        members:project_members (
          id,
          role,
          permissions_json,
          user:profiles (
            id,
            display_name,
            avatar_url,
            email
          )
        )
      `
      )
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: { message: "Project not found" } });
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/projects/:id
 * Update a project (Client or Consultant only)
 */
router.patch("/:id", verifySupabaseJwt, async (req, res, next) => {
  try {
    const { title, brief, status } = req.body;

    // Check if user is client or consultant
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("client_id, consultant_id")
      .eq("id", req.params.id)
      .single();

    if (!project) {
      return res.status(404).json({ error: { message: "Project not found" } });
    }

    const isOwner =
      project.client_id === req.user.id ||
      project.consultant_id === req.user.id;
    if (!isOwner) {
      return res
        .status(403)
        .json({ error: { message: "Insufficient permissions" } });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (brief !== undefined) updates.brief = brief;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabaseAdmin
      .from("projects")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects/:id/assign-consultant
 * Assign a consultant to a project (Admin only)
 */
router.post(
  "/:id/assign-consultant",
  verifySupabaseJwt,
  requirePersona("admin"),
  async (req, res, next) => {
    try {
      const { consultant_id } = req.body;

      // Verify consultant is verified
      const { data: consultant } = await supabaseAdmin
        .from("profiles")
        .select("is_consultant_verified")
        .eq("id", consultant_id)
        .single();

      if (!consultant?.is_consultant_verified) {
        return res
          .status(400)
          .json({ error: { message: "User is not a verified consultant" } });
      }

      // Update project
      const { data, error } = await supabaseAdmin
        .from("projects")
        .update({ consultant_id })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;

      // Add consultant as project member
      const { error: memberError } = await supabaseAdmin
        .from("project_members")
        .insert({
          project_id: req.params.id,
          user_id: consultant_id,
          role: "consultant",
        });

      if (memberError && memberError.code !== "23505") {
        // Ignore duplicate key error
        throw memberError;
      }

      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
