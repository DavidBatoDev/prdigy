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
      .select(
        `
        *,
        assigned_to_user:profiles!roadmap_tasks_assigned_to_fkey(*),
        comments:roadmap_task_comments(count),
        attachments:roadmap_task_attachments(count)
      `,
      )
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
        .select(
          `
        *,
        assigned_to_user:profiles!roadmap_tasks_assigned_to_fkey(*),
        comments:roadmap_task_comments(count),
        attachments:roadmap_task_attachments(count)
      `,
        )
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
        .select(
          `
        *,
        assigned_to_user:profiles!roadmap_tasks_assigned_to_fkey(*),
        comments:roadmap_task_comments(*),
        attachments:roadmap_task_attachments(*)
      `,
        )
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
      const {
        feature_id,
        title,
        description,
        priority,
        status,
        assigned_to,
        estimated_hours,
        actual_hours,
        due_date,
        labels,
        checklist,
        position,
      } = req.body;

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

      // Validate checklist if provided
      if (checklist) {
        if (!Array.isArray(checklist)) {
          return res.status(400).json({
            error: { message: "Checklist must be an array" },
          });
        }
        for (const item of checklist) {
          if (!item.text || typeof item.text !== "string") {
            return res.status(400).json({
              error: { message: "Each checklist item must have a text field" },
            });
          }
          if (typeof item.completed !== "boolean") {
            return res.status(400).json({
              error: {
                message:
                  "Each checklist item must have a completed boolean field",
              },
            });
          }
        }
      }

      // Validate labels if provided
      if (labels && !Array.isArray(labels)) {
        return res.status(400).json({
          error: { message: "Labels must be an array" },
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
        description: description || null,
        priority: priority || "medium",
        status: status || "todo",
        assigned_to: assigned_to || null,
        estimated_hours: estimated_hours || null,
        actual_hours: actual_hours || null,
        due_date: due_date || null,
        labels: labels || [],
        checklist: checklist || null,
        position: taskPosition,
      };

      const { data, error } = await supabaseAdmin
        .from("roadmap_tasks")
        .insert(insertData)
        .select(
          `
        *,
        assigned_to_user:profiles!roadmap_tasks_assigned_to_fkey(*)
      `,
        )
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
      const {
        title,
        description,
        priority,
        status,
        assigned_to,
        estimated_hours,
        actual_hours,
        due_date,
        labels,
        checklist,
        position,
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

      // Validate checklist if provided
      if (checklist) {
        if (!Array.isArray(checklist)) {
          return res.status(400).json({
            error: { message: "Checklist must be an array" },
          });
        }
        for (const item of checklist) {
          if (!item.text || typeof item.text !== "string") {
            return res.status(400).json({
              error: { message: "Each checklist item must have a text field" },
            });
          }
          if (typeof item.completed !== "boolean") {
            return res.status(400).json({
              error: {
                message:
                  "Each checklist item must have a completed boolean field",
              },
            });
          }
        }
      }

      // Validate labels if provided
      if (labels && !Array.isArray(labels)) {
        return res.status(400).json({
          error: { message: "Labels must be an array" },
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
        description: description || null,
        priority: priority || "medium",
        status: status || "todo",
        assigned_to: assigned_to || null,
        estimated_hours: estimated_hours || null,
        actual_hours: actual_hours || null,
        due_date: due_date || null,
        labels: labels || [],
        checklist: checklist || null,
        position: taskPosition,
      };

      const { data, error } = await supabaseAdmin
        .from("roadmap_tasks")
        .insert(insertData)
        .select(
          `
        *,
        assigned_to_user:profiles!roadmap_tasks_assigned_to_fkey(*)
      `,
        )
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
      const {
        title,
        description,
        priority,
        status,
        assigned_to,
        estimated_hours,
        actual_hours,
        due_date,
        labels,
        checklist,
        position,
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

      // Validate checklist if provided
      if (checklist !== undefined && checklist !== null) {
        if (!Array.isArray(checklist)) {
          return res.status(400).json({
            error: { message: "Checklist must be an array" },
          });
        }
        for (const item of checklist) {
          if (!item.text || typeof item.text !== "string") {
            return res.status(400).json({
              error: { message: "Each checklist item must have a text field" },
            });
          }
          if (typeof item.completed !== "boolean") {
            return res.status(400).json({
              error: {
                message:
                  "Each checklist item must have a completed boolean field",
              },
            });
          }
        }
      }

      // Validate labels if provided
      if (labels !== undefined && !Array.isArray(labels)) {
        return res.status(400).json({
          error: { message: "Labels must be an array" },
        });
      }

      // Build update object
      const updateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (status !== undefined) updateData.status = status;
      if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
      if (estimated_hours !== undefined)
        updateData.estimated_hours = estimated_hours;
      if (actual_hours !== undefined) updateData.actual_hours = actual_hours;
      if (due_date !== undefined) updateData.due_date = due_date;
      if (labels !== undefined) updateData.labels = labels;
      if (checklist !== undefined) updateData.checklist = checklist;
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
        .select(
          `
        *,
        assigned_to_user:profiles!roadmap_tasks_assigned_to_fkey(*)
      `,
        )
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
        .select(
          `
        *,
        assigned_to_user:profiles!roadmap_tasks_assigned_to_fkey(*)
      `,
        )
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
        .select(
          `
        *,
        assigned_to_user:profiles!roadmap_tasks_assigned_to_fkey(*)
      `,
        )
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
      const { id } = req.params;
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({
          error: { message: "user_id is required" },
        });
      }

      // Verify the user exists
      const { data: userExists, error: userError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", user_id)
        .single();

      if (userError || !userExists) {
        return res.status(400).json({
          error: { message: "Invalid user_id" },
        });
      }

      const { data, error } = await supabaseAdmin
        .from("roadmap_tasks")
        .update({ assigned_to: user_id })
        .eq("id", id)
        .select(
          `
        *,
        assigned_to_user:profiles!roadmap_tasks_assigned_to_fkey(*)
      `,
        )
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

      const { data, error } = await supabaseAdmin
        .from("roadmap_tasks")
        .update({ assigned_to: null })
        .eq("id", id)
        .select(
          `
        *,
        assigned_to_user:profiles!roadmap_tasks_assigned_to_fkey(*)
      `,
        )
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
