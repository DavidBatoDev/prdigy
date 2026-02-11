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
 * GET /api/tasks
 * List all tasks for a feature (query param version)
 */
router.get("/tasks", verifySupabaseJwt, readLimiter, async (req, res, next) => {
  try {
    const { feature_id } = req.query;

    if (!feature_id) {
      return res.status(400).json({
        error: { message: "feature_id query parameter is required" },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("roadmap_tasks")
      .select("*")
      .eq("feature_id", feature_id)
      .order("position", { ascending: true });

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/features/:featureId/tasks
 * List all tasks for a feature (legacy path param version)
 */
router.get(
  "/features/:featureId/tasks",
  verifySupabaseJwt,
  readLimiter,
  async (req, res, next) => {
    try {
      const { featureId } = req.params;

      const { data, error } = await supabaseAdmin
        .from("roadmap_tasks")
        .select("*")
        .eq("feature_id", featureId)
        .order("position", { ascending: true });

      if (error) throw error;

      res.json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/tasks/:id
 * Get a single task with all details
 */
router.get(
  "/tasks/:id",
  verifySupabaseJwt,
  readLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data: task, error: taskError } = await supabaseAdmin
        .from("roadmap_tasks")
        .select("*")
        .eq("id", id)
        .single();

      if (taskError) {
        if (taskError.code === "PGRST116") {
          return res.status(404).json({
            error: { message: "Task not found" },
          });
        }
        throw taskError;
      }

      res.json({ data: task });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/tasks
 * Create a new task (unified version with feature_id in body)
 */
router.post(
  "/tasks",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { feature_id, title, priority, status, due_date, position } =
        req.body;

      // Validate required fields
      if (!feature_id) {
        return res.status(400).json({
          error: { message: "feature_id is required" },
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

      // Validate priority if provided
      const validPriorities = ["urgent", "high", "medium", "low"];
      if (priority && !validPriorities.includes(priority)) {
        return res.status(400).json({
          error: { message: "Invalid priority value" },
        });
      }

      // Validate status if provided
      const validStatuses = [
        "todo",
        "in_progress",
        "in_review",
        "done",
        "blocked",
      ];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          error: { message: "Invalid status value" },
        });
      }

      // Get the next position if not provided
      let taskPosition = position;
      if (taskPosition === undefined || taskPosition === null) {
        const { data: maxPositionData } = await supabaseAdmin
          .from("roadmap_tasks")
          .select("position")
          .eq("feature_id", feature_id)
          .order("position", { ascending: false })
          .limit(1)
          .single();

        taskPosition = maxPositionData ? maxPositionData.position + 1 : 0;
      }

      // Prepare insert data
      const insertData = {
        feature_id: feature_id,
        title: title.trim(),
        priority: priority || "medium",
        status: status || "todo",
        due_date: due_date || null,
        position: taskPosition,
      };

      const { data, error } = await supabaseAdmin
        .from("roadmap_tasks")
        .insert(insertData)
        .select("*")
        .single();

      if (error) throw error;

      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/features/:featureId/tasks
 * Create a new task (legacy path param version)
 */
router.post(
  "/features/:featureId/tasks",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { featureId } = req.params;
      const { title, priority, status, due_date, position } = req.body;

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
      const validPriorities = ["urgent", "high", "medium", "low"];
      if (priority && !validPriorities.includes(priority)) {
        return res.status(400).json({
          error: { message: "Invalid priority value" },
        });
      }

      // Validate status if provided
      const validStatuses = [
        "todo",
        "in_progress",
        "in_review",
        "done",
        "blocked",
      ];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          error: { message: "Invalid status value" },
        });
      }

      // Get the next position if not provided
      let taskPosition = position;
      if (taskPosition === undefined || taskPosition === null) {
        const { data: maxPositionData } = await supabaseAdmin
          .from("roadmap_tasks")
          .select("position")
          .eq("feature_id", featureId)
          .order("position", { ascending: false })
          .limit(1)
          .single();

        taskPosition = maxPositionData ? maxPositionData.position + 1 : 0;
      }

      // Prepare insert data
      const insertData = {
        feature_id: featureId,
        title: title.trim(),
        priority: priority || "medium",
        status: status || "todo",
        due_date: due_date || null,
        position: taskPosition,
      };

      const { data, error } = await supabaseAdmin
        .from("roadmap_tasks")
        .insert(insertData)
        .select("*")
        .single();

      if (error) throw error;

      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/tasks/:id
 * Update a task
 */
router.patch(
  "/tasks/:id",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, priority, status, due_date, completed_at, position } =
        req.body;

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
        const validPriorities = ["urgent", "high", "medium", "low"];
        if (!validPriorities.includes(priority)) {
          return res.status(400).json({
            error: { message: "Invalid priority value" },
          });
        }
      }

      // Validate status if provided
      if (status !== undefined) {
        const validStatuses = [
          "todo",
          "in_progress",
          "in_review",
          "done",
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
      if (priority !== undefined) updateData.priority = priority;
      if (status !== undefined) updateData.status = status;
      if (due_date !== undefined) updateData.due_date = due_date;
      if (completed_at !== undefined) updateData.completed_at = completed_at;
      if (position !== undefined) updateData.position = position;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: { message: "No fields to update" },
        });
      }

      const { data, error } = await supabaseAdmin
        .from("roadmap_tasks")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({
            error: { message: "Task not found or access denied" },
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
 * PATCH /api/tasks/reorder
 * Bulk reorder tasks within a feature
 */
router.patch(
  "/tasks/reorder",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { feature_id, reorders } = req.body;

      if (!feature_id) {
        return res.status(400).json({
          error: { message: "feature_id is required" },
        });
      }

      if (!Array.isArray(reorders) || reorders.length === 0) {
        return res.status(400).json({
          error: { message: "reorders must be a non-empty array" },
        });
      }

      // Validate each reorder item
      for (const item of reorders) {
        if (!item.id || typeof item.position !== "number") {
          return res.status(400).json({
            error: {
              message: "Each reorder item must have an id and position",
            },
          });
        }
      }

      // Perform bulk update
      const updatePromises = reorders.map((item) =>
        supabaseAdmin
          .from("roadmap_tasks")
          .update({ position: item.position })
          .eq("id", item.id)
          .eq("feature_id", feature_id),
      );

      await Promise.all(updatePromises);

      // Fetch updated tasks
      const { data, error } = await supabaseAdmin
        .from("roadmap_tasks")
        .select("*")
        .eq("feature_id", feature_id)
        .order("position", { ascending: true });

      if (error) throw error;

      res.json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/tasks/:id/reorder
 * Update task position (legacy single task reorder)
 */
router.patch(
  "/tasks/:id/reorder",
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

      // Get the task to verify access and get feature_id
      const { data: task, error: taskError } = await supabaseAdmin
        .from("roadmap_tasks")
        .select("feature_id, position")
        .eq("id", id)
        .single();

      if (taskError) {
        if (taskError.code === "PGRST116") {
          return res.status(404).json({
            error: { message: "Task not found" },
          });
        }
        throw taskError;
      }

      const oldPosition = task.position;
      const newPosition = position;

      if (oldPosition === newPosition) {
        return res.json({ data: { message: "Position unchanged" } });
      }

      // Update positions
      if (newPosition > oldPosition) {
        await supabaseAdmin
          .from("roadmap_tasks")
          .update({ position: supabaseAdmin.raw("position - 1") })
          .eq("feature_id", task.feature_id)
          .gt("position", oldPosition)
          .lte("position", newPosition);
      } else {
        await supabaseAdmin
          .from("roadmap_tasks")
          .update({ position: supabaseAdmin.raw("position + 1") })
          .eq("feature_id", task.feature_id)
          .gte("position", newPosition)
          .lt("position", oldPosition);
      }

      // Update the task's position
      const { data, error } = await supabaseAdmin
        .from("roadmap_tasks")
        .update({ position: newPosition })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      res.json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/tasks/:id/assign
 * Assign task to a user
 */
router.patch(
  "/tasks/:id/assign",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      return res.status(410).json({
        error: {
          message:
            "Task assignment is not supported. The assignee field was removed from the schema.",
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /api/tasks/:id/unassign
 * Unassign task from current user
 */
router.patch(
  "/tasks/:id/unassign",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      return res.status(410).json({
        error: {
          message:
            "Task assignment is not supported. The assignee field was removed from the schema.",
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete(
  "/tasks/:id",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from("roadmap_tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      res.json({
        data: { message: "Task deleted successfully" },
      });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
