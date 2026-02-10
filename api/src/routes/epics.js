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
 * GET /api/roadmaps/:roadmapId/epics
 * List all epics for a roadmap
 */
router.get("/roadmaps/:roadmapId/epics", verifySupabaseJwt, readLimiter, async (req, res, next) => {
  try {
    const { roadmapId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("roadmap_epics")
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
 * GET /api/epics/:id
 * Get a single epic with its features
 */
router.get("/epics/:id", verifySupabaseJwt, readLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("roadmap_epics")
      .select(`
        *,
        features:roadmap_features(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({
          error: { message: "Epic not found" },
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
 * POST /api/roadmaps/:roadmapId/epics
 * Create a new epic
 */
router.post("/roadmaps/:roadmapId/epics", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { roadmapId } = req.params;
    const {
      title,
      description,
      priority,
      status,
      position,
      color,
      estimated_hours,
      actual_hours,
      start_date,
      due_date,
      completed_date,
      tags,
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

    // Validate priority if provided
    const validPriorities = ["critical", "high", "medium", "low", "nice_to_have"];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        error: { message: "Invalid priority value" },
      });
    }

    // Validate status if provided
    const validStatuses = ["backlog", "planned", "in_progress", "in_review", "completed", "on_hold"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: { message: "Invalid status value" },
      });
    }

    // Get the next position if not provided
    let epicPosition = position;
    if (epicPosition === undefined || epicPosition === null) {
      const { data: maxPositionData } = await supabaseAdmin
        .from("roadmap_epics")
        .select("position")
        .eq("roadmap_id", roadmapId)
        .order("position", { ascending: false })
        .limit(1)
        .single();

      epicPosition = maxPositionData ? maxPositionData.position + 1 : 0;
    }

    // Prepare insert data
    const insertData = {
      roadmap_id: roadmapId,
      title: title.trim(),
      description: description || null,
      priority: priority || "medium",
      status: status || "backlog",
      position: epicPosition,
      color: color || null,
      estimated_hours: estimated_hours || null,
      actual_hours: actual_hours || null,
      start_date: start_date || null,
      due_date: due_date || null,
      completed_date: completed_date || null,
      tags: tags || [],
    };

    const { data, error } = await supabaseAdmin
      .from("roadmap_epics")
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
 * PATCH /api/epics/:id
 * Update an epic
 */
router.patch("/epics/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      status,
      position,
      color,
      estimated_hours,
      actual_hours,
      start_date,
      due_date,
      completed_date,
      tags,
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

    // Validate priority if provided
    if (priority !== undefined) {
      const validPriorities = ["critical", "high", "medium", "low", "nice_to_have"];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          error: { message: "Invalid priority value" },
        });
      }
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ["backlog", "planned", "in_progress", "in_review", "completed", "on_hold"];
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
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (position !== undefined) updateData.position = position;
    if (color !== undefined) updateData.color = color;
    if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours;
    if (actual_hours !== undefined) updateData.actual_hours = actual_hours;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (completed_date !== undefined) updateData.completed_date = completed_date;
    if (tags !== undefined) updateData.tags = tags;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: { message: "No fields to update" },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("roadmap_epics")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({
          error: { message: "Epic not found or access denied" },
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
 * PATCH /api/epics/:id/reorder
 * Update epic position
 */
router.patch("/epics/:id/reorder", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    if (position === undefined || position === null || typeof position !== "number") {
      return res.status(400).json({
        error: { message: "Valid position is required" },
      });
    }

    // Get the epic to verify access and get roadmap_id
    const { data: epic, error: epicError } = await supabaseAdmin
      .from("roadmap_epics")
      .select("roadmap_id, position")
      .eq("id", id)
      .single();

    if (epicError) {
      if (epicError.code === "PGRST116") {
        return res.status(404).json({
          error: { message: "Epic not found" },
        });
      }
      throw epicError;
    }

    const oldPosition = epic.position;
    const newPosition = position;

    if (oldPosition === newPosition) {
      return res.json({ data: { message: "Position unchanged" } });
    }

    // Use transaction-like approach: update positions
    if (newPosition > oldPosition) {
      // Moving down: decrement positions between old and new
      await supabaseAdmin
        .from("roadmap_epics")
        .update({ position: supabaseAdmin.raw("position - 1") })
        .eq("roadmap_id", epic.roadmap_id)
        .gt("position", oldPosition)
        .lte("position", newPosition);
    } else {
      // Moving up: increment positions between new and old
      await supabaseAdmin
        .from("roadmap_epics")
        .update({ position: supabaseAdmin.raw("position + 1") })
        .eq("roadmap_id", epic.roadmap_id)
        .gte("position", newPosition)
        .lt("position", oldPosition);
    }

    // Update the epic's position
    const { data, error } = await supabaseAdmin
      .from("roadmap_epics")
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
 * DELETE /api/epics/:id
 * Delete an epic (cascades to features and tasks)
 */
router.delete("/epics/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("roadmap_epics")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      data: { message: "Epic deleted successfully" },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
