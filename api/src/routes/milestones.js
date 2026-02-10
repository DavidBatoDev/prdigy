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
 * GET /api/roadmaps/:roadmapId/milestones
 * List all milestones for a roadmap
 */
router.get("/roadmaps/:roadmapId/milestones", verifySupabaseJwt, readLimiter, async (req, res, next) => {
  try {
    const { roadmapId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("roadmap_milestones")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .order("position", { ascending: true });

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/milestones/:id
 * Get a single milestone with linked features
 */
router.get("/milestones/:id", verifySupabaseJwt, readLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: milestone, error: milestoneError } = await supabaseAdmin
      .from("roadmap_milestones")
      .select("*")
      .eq("id", id)
      .single();

    if (milestoneError) {
      if (milestoneError.code === "PGRST116") {
        return res.status(404).json({
          error: { message: "Milestone not found" },
        });
      }
      throw milestoneError;
    }

    // Get linked features
    const { data: linkedFeatures, error: featuresError } = await supabaseAdmin
      .from("milestone_features")
      .select(`
        position,
        feature:roadmap_features(*)
      `)
      .eq("milestone_id", id)
      .order("position", { ascending: true });

    if (featuresError) throw featuresError;

    res.json({
      data: {
        ...milestone,
        linked_features: linkedFeatures || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/roadmaps/:roadmapId/milestones
 * Create a new milestone
 */
router.post("/roadmaps/:roadmapId/milestones", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { roadmapId } = req.params;
    const {
      title,
      description,
      target_date,
      completed_date,
      status,
      position,
      color,
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

    if (!target_date) {
      return res.status(400).json({
        error: { message: "Target date is required" },
      });
    }

    // Validate status if provided
    const validStatuses = ["not_started", "in_progress", "at_risk", "completed", "missed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: { message: "Invalid status value" },
      });
    }

    // Get the next position if not provided
    let milestonePosition = position;
    if (milestonePosition === undefined || milestonePosition === null) {
      const { data: maxPositionData } = await supabaseAdmin
        .from("roadmap_milestones")
        .select("position")
        .eq("roadmap_id", roadmapId)
        .order("position", { ascending: false })
        .limit(1)
        .single();

      milestonePosition = maxPositionData ? maxPositionData.position + 1 : 0;
    }

    // Prepare insert data
    const insertData = {
      roadmap_id: roadmapId,
      title: title.trim(),
      description: description || null,
      target_date,
      completed_date: completed_date || null,
      status: status || "not_started",
      position: milestonePosition,
      color: color || null,
    };

    const { data, error } = await supabaseAdmin
      .from("roadmap_milestones")
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
 * PATCH /api/milestones/:id
 * Update a milestone
 */
router.patch("/milestones/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      target_date,
      completed_date,
      status,
      position,
      color,
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
      const validStatuses = ["not_started", "in_progress", "at_risk", "completed", "missed"];
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
    if (target_date !== undefined) updateData.target_date = target_date;
    if (completed_date !== undefined) updateData.completed_date = completed_date;
    if (status !== undefined) updateData.status = status;
    if (position !== undefined) updateData.position = position;
    if (color !== undefined) updateData.color = color;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: { message: "No fields to update" },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("roadmap_milestones")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({
          error: { message: "Milestone not found or access denied" },
        });
      }
      throw error;
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/milestones/:id/reorder
 * Update milestone position
 */
router.patch("/milestones/:id/reorder", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    if (position === undefined || position === null || typeof position !== "number") {
      return res.status(400).json({
        error: { message: "Valid position is required" },
      });
    }

    // Get the milestone to verify access and get roadmap_id
    const { data: milestone, error: milestoneError } = await supabaseAdmin
      .from("roadmap_milestones")
      .select("roadmap_id, position")
      .eq("id", id)
      .single();

    if (milestoneError) {
      if (milestoneError.code === "PGRST116") {
        return res.status(404).json({
          error: { message: "Milestone not found" },
        });
      }
      throw milestoneError;
    }

    const oldPosition = milestone.position;
    const newPosition = position;

    if (oldPosition === newPosition) {
      return res.json({ data: { message: "Position unchanged" } });
    }

    // Update positions
    if (newPosition > oldPosition) {
      await supabaseAdmin
        .from("roadmap_milestones")
        .update({ position: supabaseAdmin.raw("position - 1") })
        .eq("roadmap_id", milestone.roadmap_id)
        .gt("position", oldPosition)
        .lte("position", newPosition);
    } else {
      await supabaseAdmin
        .from("roadmap_milestones")
        .update({ position: supabaseAdmin.raw("position + 1") })
        .eq("roadmap_id", milestone.roadmap_id)
        .gte("position", newPosition)
        .lt("position", oldPosition);
    }

    // Update the milestone's position
    const { data, error } = await supabaseAdmin
      .from("roadmap_milestones")
      .update({ position: newPosition })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/milestones/:id
 * Delete a milestone
 */
router.delete("/milestones/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("roadmap_milestones")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      data: { message: "Milestone deleted successfully" },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
