const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { verifySupabaseJwt } = require("../middleware/auth");
const { supabaseAdmin } = require("../lib/supabase");

// Rate limiters
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests. Please try again later.",
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many requests. Please try again later.",
});

/**
 * GET /api/features
 * List all features for an epic (with query param)
 */
router.get(
  "/features",
  verifySupabaseJwt,
  readLimiter,
  async (req, res, next) => {
    try {
      const { epic_id } = req.query;

      if (!epic_id) {
        return res.status(400).json({
          error: { message: "epic_id query parameter is required" },
        });
      }

      const { data, error } = await supabaseAdmin
        .from("roadmap_features")
        .select("*")
        .eq("epic_id", epic_id)
        .order("position", { ascending: true });

      if (error) throw error;

      res.json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/epics/:epicId/features
 * List all features for an epic (legacy route for backward compatibility)
 */
router.get(
  "/epics/:epicId/features",
  verifySupabaseJwt,
  readLimiter,
  async (req, res, next) => {
    try {
      const { epicId } = req.params;

      const { data, error } = await supabaseAdmin
        .from("roadmap_features")
        .select("*")
        .eq("epic_id", epicId)
        .order("position", { ascending: true });

      if (error) throw error;

      res.json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/features/:id
 * Get a single feature with its tasks
 */
router.get(
  "/features/:id",
  verifySupabaseJwt,
  readLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from("roadmap_features")
        .select(
          `
        *,
        tasks:roadmap_tasks(*)
      `,
        )
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({
            error: { message: "Feature not found" },
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
 * POST /api/features
 * Create a new feature
 */
router.post(
  "/features",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const {
        roadmap_id,
        epic_id,
        title,
        description,
        status,
        position,
        is_deliverable,
        estimated_hours,
        actual_hours,
      } = req.body;

      // Validate required fields
      if (!roadmap_id) {
        return res.status(400).json({
          error: { message: "roadmap_id is required" },
        });
      }

      if (!epic_id) {
        return res.status(400).json({
          error: { message: "epic_id is required" },
        });
      }

      if (!title || typeof title !== "string" || title.trim().length === 0) {
        return res.status(400).json({
          error: { message: "Title is required" },
        });
      }

      if (title.length > 200) {
        return res.status(400).json({
          error: { message: "Title must be 200 characters or less" },
        });
      }

      // Validate status if provided
      const validStatuses = [
        "not_started",
        "in_progress",
        "in_review",
        "completed",
        "blocked",
      ];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          error: { message: "Invalid status value" },
        });
      }

      // Get the next position if not provided
      let featurePosition = position;
      if (featurePosition === undefined || featurePosition === null) {
        const { data: maxPositionData } = await supabaseAdmin
          .from("roadmap_features")
          .select("position")
          .eq("epic_id", epic_id)
          .order("position", { ascending: false })
          .limit(1)
          .single();

        featurePosition = maxPositionData ? maxPositionData.position + 1 : 0;
      }

      // Prepare insert data
      const insertData = {
        roadmap_id,
        epic_id,
        title: title.trim(),
        description: description || null,
        status: status || "not_started",
        position: featurePosition,
        is_deliverable: is_deliverable !== undefined ? is_deliverable : true,
        estimated_hours: estimated_hours || null,
        actual_hours: actual_hours || null,
      };

      const { data, error } = await supabaseAdmin
        .from("roadmap_features")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/epics/:epicId/features
 * Create a new feature (legacy route for backward compatibility)
 */
router.post(
  "/epics/:epicId/features",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { epicId } = req.params;
      const {
        title,
        description,
        status,
        position,
        is_deliverable,
        estimated_hours,
        actual_hours,
      } = req.body;

      // Validate required fields
      if (!title || typeof title !== "string" || title.trim().length === 0) {
        return res.status(400).json({
          error: { message: "Title is required" },
        });
      }

      if (title.length > 200) {
        return res.status(400).json({
          error: { message: "Title must be 200 characters or less" },
        });
      }

      // Validate status if provided
      const validStatuses = [
        "not_started",
        "in_progress",
        "in_review",
        "completed",
        "blocked",
      ];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          error: { message: "Invalid status value" },
        });
      }

      // Get epic's roadmap_id for denormalized storage
      const { data: epic, error: epicError } = await supabaseAdmin
        .from("roadmap_epics")
        .select("roadmap_id")
        .eq("id", epicId)
        .single();

      if (epicError) {
        if (epicError.code === "PGRST116") {
          return res.status(404).json({
            error: { message: "Epic not found" },
          });
        }
        throw epicError;
      }

      // Get the next position if not provided
      let featurePosition = position;
      if (featurePosition === undefined || featurePosition === null) {
        const { data: maxPositionData } = await supabaseAdmin
          .from("roadmap_features")
          .select("position")
          .eq("epic_id", epicId)
          .order("position", { ascending: false })
          .limit(1)
          .single();

        featurePosition = maxPositionData ? maxPositionData.position + 1 : 0;
      }

      // Prepare insert data
      const insertData = {
        roadmap_id: epic.roadmap_id,
        epic_id: epicId,
        title: title.trim(),
        description: description || null,
        status: status || "not_started",
        position: featurePosition,
        is_deliverable: is_deliverable !== undefined ? is_deliverable : true,
        estimated_hours: estimated_hours || null,
        actual_hours: actual_hours || null,
      };

      const { data, error } = await supabaseAdmin
        .from("roadmap_features")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/features/:id
 * Update a feature
 */
router.patch(
  "/features/:id",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        status,
        position,
        is_deliverable,
        estimated_hours,
        actual_hours,
      } = req.body;

      // Validate title if provided
      if (title !== undefined) {
        if (typeof title !== "string" || title.trim().length === 0) {
          return res.status(400).json({
            error: { message: "Title must be a non-empty string" },
          });
        }
        if (title.length > 200) {
          return res.status(400).json({
            error: { message: "Title must be 200 characters or less" },
          });
        }
      }

      // Validate status if provided
      if (status !== undefined) {
        const validStatuses = [
          "not_started",
          "in_progress",
          "in_review",
          "completed",
          "blocked",
        ];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            error: { message: "Invalid status value" },
          });
        }
      }

      // Build update object
      const updateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (position !== undefined) updateData.position = position;
      if (is_deliverable !== undefined)
        updateData.is_deliverable = is_deliverable;
      if (estimated_hours !== undefined)
        updateData.estimated_hours = estimated_hours;
      if (actual_hours !== undefined) updateData.actual_hours = actual_hours;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: { message: "No fields to update" },
        });
      }

      const { data, error } = await supabaseAdmin
        .from("roadmap_features")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({
            error: { message: "Feature not found or access denied" },
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
 * PATCH /api/features/reorder
 * Bulk reorder features within an epic
 */
router.patch(
  "/features/reorder",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { epic_id, reorders } = req.body;

      if (!epic_id) {
        return res.status(400).json({
          error: { message: "epic_id is required" },
        });
      }

      if (!Array.isArray(reorders) || reorders.length === 0) {
        return res.status(400).json({
          error: { message: "reorders must be a non-empty array" },
        });
      }

      // Validate each reorder item
      for (const reorder of reorders) {
        if (
          !reorder.feature_id ||
          typeof reorder.new_order_index !== "number"
        ) {
          return res.status(400).json({
            error: {
              message: "Each reorder must have feature_id and new_order_index",
            },
          });
        }
      }

      // Update each feature's position
      for (const reorder of reorders) {
        await supabaseAdmin
          .from("roadmap_features")
          .update({ position: reorder.new_order_index })
          .eq("id", reorder.feature_id)
          .eq("epic_id", epic_id);
      }

      res.json({ data: { message: "Features reordered successfully" } });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/features/:id/reorder
 * Update feature position (legacy route for backward compatibility)
 */
router.patch(
  "/features/:id/reorder",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { position } = req.body;

      if (
        position === undefined ||
        position === null ||
        typeof position !== "number"
      ) {
        return res.status(400).json({
          error: { message: "Valid position is required" },
        });
      }

      // Get the feature to verify access and get epic_id
      const { data: feature, error: featureError } = await supabaseAdmin
        .from("roadmap_features")
        .select("epic_id, position")
        .eq("id", id)
        .single();

      if (featureError) {
        if (featureError.code === "PGRST116") {
          return res.status(404).json({
            error: { message: "Feature not found" },
          });
        }
        throw featureError;
      }

      const oldPosition = feature.position;
      const newPosition = position;

      if (oldPosition === newPosition) {
        return res.json({ data: { message: "Position unchanged" } });
      }

      // Update positions
      if (newPosition > oldPosition) {
        await supabaseAdmin
          .from("roadmap_features")
          .update({ position: supabaseAdmin.raw("position - 1") })
          .eq("epic_id", feature.epic_id)
          .gt("position", oldPosition)
          .lte("position", newPosition);
      } else {
        await supabaseAdmin
          .from("roadmap_features")
          .update({ position: supabaseAdmin.raw("position + 1") })
          .eq("epic_id", feature.epic_id)
          .gte("position", newPosition)
          .lt("position", oldPosition);
      }

      // Update the feature's position
      const { data, error } = await supabaseAdmin
        .from("roadmap_features")
        .update({ position: newPosition })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      res.json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/features/link-milestone
 * Link a feature to a milestone
 */
router.post(
  "/features/link-milestone",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { feature_id, milestone_id, position } = req.body;

      if (!feature_id) {
        return res.status(400).json({
          error: { message: "feature_id is required" },
        });
      }

      if (!milestone_id) {
        return res.status(400).json({
          error: { message: "milestone_id is required" },
        });
      }

      // Check if link already exists
      const { data: existingLink } = await supabaseAdmin
        .from("milestone_features")
        .select("id")
        .eq("milestone_id", milestone_id)
        .eq("feature_id", feature_id)
        .single();

      if (existingLink) {
        return res.status(400).json({
          error: { message: "Feature is already linked to this milestone" },
        });
      }

      // Get the next position if not provided
      let linkPosition = position !== undefined ? position : 0;
      if (position === undefined) {
        const { data: maxPositionData } = await supabaseAdmin
          .from("milestone_features")
          .select("position")
          .eq("milestone_id", milestone_id)
          .order("position", { ascending: false })
          .limit(1)
          .single();

        linkPosition = maxPositionData ? maxPositionData.position + 1 : 0;
      }

      const { data, error } = await supabaseAdmin
        .from("milestone_features")
        .insert({
          milestone_id,
          feature_id,
          position: linkPosition,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/features/unlink-milestone
 * Unlink a feature from a milestone
 */
router.post(
  "/features/unlink-milestone",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { feature_id, milestone_id } = req.body;

      if (!feature_id) {
        return res.status(400).json({
          error: { message: "feature_id is required" },
        });
      }

      if (!milestone_id) {
        return res.status(400).json({
          error: { message: "milestone_id is required" },
        });
      }

      const { error } = await supabaseAdmin
        .from("milestone_features")
        .delete()
        .eq("milestone_id", milestone_id)
        .eq("feature_id", feature_id);

      if (error) throw error;

      res.json({
        data: { message: "Feature unlinked from milestone successfully" },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/features/:id/link-milestone
 * Link a feature to a milestone (legacy route for backward compatibility)
 */
router.post(
  "/features/:id/link-milestone",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { milestone_id, position } = req.body;

      if (!milestone_id) {
        return res.status(400).json({
          error: { message: "milestone_id is required" },
        });
      }

      // Check if link already exists
      const { data: existingLink } = await supabaseAdmin
        .from("milestone_features")
        .select("id")
        .eq("milestone_id", milestone_id)
        .eq("feature_id", id)
        .single();

      if (existingLink) {
        return res.status(400).json({
          error: { message: "Feature is already linked to this milestone" },
        });
      }

      // Get the next position if not provided
      let linkPosition = position !== undefined ? position : 0;
      if (position === undefined) {
        const { data: maxPositionData } = await supabaseAdmin
          .from("milestone_features")
          .select("position")
          .eq("milestone_id", milestone_id)
          .order("position", { ascending: false })
          .limit(1)
          .single();

        linkPosition = maxPositionData ? maxPositionData.position + 1 : 0;
      }

      const { data, error } = await supabaseAdmin
        .from("milestone_features")
        .insert({
          milestone_id,
          feature_id: id,
          position: linkPosition,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/features/:id/unlink-milestone/:milestoneId
 * Unlink a feature from a milestone
 */
router.delete(
  "/features/:id/unlink-milestone/:milestoneId",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { id, milestoneId } = req.params;

      const { error } = await supabaseAdmin
        .from("milestone_features")
        .delete()
        .eq("feature_id", id)
        .eq("milestone_id", milestoneId);

      if (error) throw error;

      res.json({
        data: { message: "Feature unlinked from milestone successfully" },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/features/:id
 * Delete a feature (cascades to tasks)
 */
router.delete(
  "/features/:id",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from("roadmap_features")
        .delete()
        .eq("id", id);

      if (error) throw error;

      res.json({
        data: { message: "Feature deleted successfully" },
      });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
