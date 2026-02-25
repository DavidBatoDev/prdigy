const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { verifySupabaseJwt } = require("../middleware/auth");
const { supabaseAdmin } = require("../lib/supabase");

// Rate limiter for read operations
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: "Too many requests. Please try again later.",
});

// Rate limiter for write operations
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests. Please try again later.",
});

/**
 * GET /api/roadmaps
 * List all roadmaps for the authenticated user
 */
router.get("/", verifySupabaseJwt, readLimiter, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("roadmaps")
      .select("*")
      .eq("owner_id", req.user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/roadmaps/preview
 * Get roadmaps with lightweight nested data for preview cards
 */
router.get(
  "/preview",
  verifySupabaseJwt,
  readLimiter,
  async (req, res, next) => {
    try {
      const { data: roadmaps, error: roadmapsError } = await supabaseAdmin
        .from("roadmaps")
        .select("id,name,description,status,project_id,created_at,updated_at")
        .eq("owner_id", req.user.id)
        .order("updated_at", { ascending: false });

      if (roadmapsError) throw roadmapsError;

      const roadmapIds = (roadmaps || []).map((roadmap) => roadmap.id);
      if (roadmapIds.length === 0) {
        return res.json({ data: [] });
      }

      const { data: epics, error: epicsError } = await supabaseAdmin
        .from("roadmap_epics")
        .select("id,roadmap_id,title,position,status")
        .in("roadmap_id", roadmapIds)
        .order("position", { ascending: true });

      if (epicsError) throw epicsError;

      const epicIds = (epics || []).map((epic) => epic.id);
      const { data: features, error: featuresError } = await supabaseAdmin
        .from("roadmap_features")
        .select("id,roadmap_id,epic_id,title,position,status")
        .in("roadmap_id", roadmapIds)
        .order("position", { ascending: true });

      if (featuresError) throw featuresError;

      const featureIds = (features || []).map((feature) => feature.id);
      const { data: tasks, error: tasksError } = featureIds.length
        ? await supabaseAdmin
            .from("roadmap_tasks")
            .select("id,feature_id,position,status")
            .in("feature_id", featureIds)
            .order("position", { ascending: true })
        : { data: [], error: null };

      if (tasksError) throw tasksError;

      const tasksByFeature = (tasks || []).reduce((acc, task) => {
        if (!acc[task.feature_id]) acc[task.feature_id] = [];
        acc[task.feature_id].push(task);
        return acc;
      }, {});

      const featuresByEpic = (features || []).reduce((acc, feature) => {
        const featureWithTasks = {
          ...feature,
          tasks: tasksByFeature[feature.id] || [],
        };
        if (!acc[feature.epic_id]) acc[feature.epic_id] = [];
        acc[feature.epic_id].push(featureWithTasks);
        return acc;
      }, {});

      const epicsByRoadmap = (epics || []).reduce((acc, epic) => {
        const epicWithFeatures = {
          ...epic,
          features: featuresByEpic[epic.id] || [],
        };
        if (!acc[epic.roadmap_id]) acc[epic.roadmap_id] = [];
        acc[epic.roadmap_id].push(epicWithFeatures);
        return acc;
      }, {});

      const previewData = (roadmaps || []).map((roadmap) => ({
        ...roadmap,
        epics: epicsByRoadmap[roadmap.id] || [],
      }));

      res.json({ data: previewData });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/roadmaps/user/:userId
 * Get roadmaps for a specific user (including guest users)
 * No authentication required for guest roadmap retrieval
 */
router.get("/user/:userId", readLimiter, async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: { message: "User ID is required" },
      });
    }

    const { data: roadmaps, error } = await supabaseAdmin
      .from("roadmaps")
      .select(
        "id, name, description, status, created_at, updated_at, project_id",
      )
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    res.json({ roadmaps: roadmaps || [] });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/roadmaps/migrate
 * Migrate roadmaps from one user to another (used for guest-to-auth migration)
 * Requires authentication
 */
router.post(
  "/migrate",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { guestUserId, targetUserId } = req.body;
      const authenticatedUserId = req.user.id;

      // Verify the target user is the authenticated user
      if (targetUserId !== authenticatedUserId) {
        return res.status(403).json({
          error: {
            message: "You can only migrate roadmaps to your own account",
          },
        });
      }

      if (!guestUserId) {
        return res.status(400).json({
          error: { message: "guestUserId is required" },
        });
      }

      // Get all roadmaps owned by guest user
      const { data: guestRoadmaps, error: fetchError } = await supabaseAdmin
        .from("roadmaps")
        .select("id")
        .eq("owner_id", guestUserId);

      if (fetchError) throw fetchError;

      if (!guestRoadmaps || guestRoadmaps.length === 0) {
        return res.json({
          success: true,
          migratedCount: 0,
        });
      }

      // Update target user profile to track guest account migration
      const { error: profileUpdateError } = await supabaseAdmin
        .from("profiles")
        .update({
          migrated_from_guest_id: guestUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      if (profileUpdateError) {
        console.error(
          "Failed to update profile with guest migration:",
          profileUpdateError,
        );
        // Don't fail the request, just log the error
      }

      // Update all roadmaps to new owner
      const { error: updateError } = await supabaseAdmin
        .from("roadmaps")
        .update({
          owner_id: targetUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("owner_id", guestUserId);

      if (updateError) throw updateError;

      res.json({
        success: true,
        migratedCount: guestRoadmaps.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/roadmaps/:id
 * Get a single roadmap by ID
 */
router.get("/:id", verifySupabaseJwt, readLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("roadmaps")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({
          error: { message: "Roadmap not found" },
        });
      }
      throw error;
    }

    // Check access via RLS (will return null if no access)
    if (!data) {
      return res.status(404).json({
        error: { message: "Roadmap not found" },
      });
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/roadmaps/:id/full
 * Get roadmap with full nested structure (milestones, epics with features and tasks)
 */
router.get(
  "/:id/full",
  verifySupabaseJwt,
  readLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Get roadmap
      const { data: roadmap, error: roadmapError } = await supabaseAdmin
        .from("roadmaps")
        .select("*")
        .eq("id", id)
        .single();

      if (roadmapError) {
        if (roadmapError.code === "PGRST116") {
          return res.status(404).json({
            error: { message: "Roadmap not found" },
          });
        }
        throw roadmapError;
      }

      // Get milestones
      const { data: milestones, error: milestonesError } = await supabaseAdmin
        .from("roadmap_milestones")
        .select("*")
        .eq("roadmap_id", id)
        .order("position", { ascending: true });

      if (milestonesError) throw milestonesError;

      // Get epics with features
      const { data: epics, error: epicsError } = await supabaseAdmin
        .from("roadmap_epics")
        .select(
          `
        *,
        features:roadmap_features(
          *,
          tasks:roadmap_tasks(*)
        )
      `,
        )
        .eq("roadmap_id", id)
        .order("position", { ascending: true });

      if (epicsError) throw epicsError;

      // Combine data
      const fullRoadmap = {
        ...roadmap,
        milestones: milestones || [],
        epics: epics || [],
      };

      res.json({ data: fullRoadmap });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/roadmaps
 * Create a new roadmap
 */
router.post("/", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const {
      name,
      description,
      project_id,
      status,
      start_date,
      end_date,
      settings,
      project_metadata,
    } = req.body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        error: { message: "Name is required" },
      });
    }

    if (name.length > 200) {
      return res.status(400).json({
        error: { message: "Name must be 200 characters or less" },
      });
    }

    // Validate status if provided
    const validStatuses = [
      "draft",
      "active",
      "paused",
      "completed",
      "archived",
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: { message: "Invalid status value" },
      });
    }

    // Prepare insert data
    const insertData = {
      name: name.trim(),
      description: description || null,
      project_id: project_id || null,
      owner_id: req.user.id,
      status: status || "draft",
      start_date: start_date || null,
      end_date: end_date || null,
      settings: settings || {},
      project_metadata: project_metadata || {},
    };

    const { data, error } = await supabaseAdmin
      .from("roadmaps")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/roadmaps/:id
 * Update a roadmap
 */
router.patch(
  "/:id",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        project_id,
        status,
        start_date,
        end_date,
        settings,
        project_metadata,
      } = req.body;

      // Validate name if provided
      if (name !== undefined) {
        if (typeof name !== "string" || name.trim().length === 0) {
          return res.status(400).json({
            error: { message: "Name must be a non-empty string" },
          });
        }
        if (name.length > 200) {
          return res.status(400).json({
            error: { message: "Name must be 200 characters or less" },
          });
        }
      }

      // Validate status if provided
      if (status !== undefined) {
        const validStatuses = [
          "draft",
          "active",
          "paused",
          "completed",
          "archived",
        ];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            error: { message: "Invalid status value" },
          });
        }
      }

      // Build update object with only provided fields
      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description;
      if (project_id !== undefined) updateData.project_id = project_id;
      if (status !== undefined) updateData.status = status;
      if (start_date !== undefined) updateData.start_date = start_date;
      if (end_date !== undefined) updateData.end_date = end_date;
      if (settings !== undefined) updateData.settings = settings;
      if (project_metadata !== undefined) updateData.project_metadata = project_metadata;

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: { message: "No fields to update" },
        });
      }

      const { data, error } = await supabaseAdmin
        .from("roadmaps")
        .update(updateData)
        .eq("id", id)
        .eq("owner_id", req.user.id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({
            error: { message: "Roadmap not found or access denied" },
          });
        }
        throw error;
      }

      res.json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/roadmaps/:id
 * Delete a roadmap (cascades to all child entities)
 */
router.delete(
  "/:id",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from("roadmaps")
        .delete()
        .eq("id", id)
        .eq("owner_id", req.user.id);

      if (error) throw error;

      res.json({
        data: { message: "Roadmap deleted successfully" },
      });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
