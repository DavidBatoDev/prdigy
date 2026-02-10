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

// ============= COMMENTS =============

/**
 * GET /api/tasks/:taskId/comments
 * Get all comments for a task
 */
router.get("/tasks/:taskId/comments", verifySupabaseJwt, readLimiter, async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("roadmap_task_comments")
      .select(`
        *,
        author:profiles!roadmap_task_comments_author_id_fkey(id, full_name, avatar_url)
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:taskId/comments
 * Add a comment to a task
 */
router.post("/tasks/:taskId/comments", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validate content
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({
        error: { message: "Comment content is required" },
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        error: { message: "Comment must be 5000 characters or less" },
      });
    }

    // Verify task exists and user has access
    const { data: task, error: taskError } = await supabaseAdmin
      .from("roadmap_tasks")
      .select("id")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return res.status(404).json({
        error: { message: "Task not found or access denied" },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("roadmap_task_comments")
      .insert({
        task_id: taskId,
        author_id: userId,
        content: content.trim(),
      })
      .select(`
        *,
        author:profiles!roadmap_task_comments_author_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/comments/:id
 * Update a comment (author only)
 */
router.patch("/comments/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validate content
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({
        error: { message: "Comment content is required" },
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        error: { message: "Comment must be 5000 characters or less" },
      });
    }

    // Verify ownership
    const { data: comment, error: commentError } = await supabaseAdmin
      .from("roadmap_task_comments")
      .select("author_id")
      .eq("id", id)
      .single();

    if (commentError || !comment) {
      return res.status(404).json({
        error: { message: "Comment not found" },
      });
    }

    if (comment.author_id !== userId) {
      return res.status(403).json({
        error: { message: "You can only edit your own comments" },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("roadmap_task_comments")
      .update({ content: content.trim() })
      .eq("id", id)
      .select(`
        *,
        author:profiles!roadmap_task_comments_author_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/comments/:id
 * Delete a comment (author or roadmap owner)
 */
router.delete("/comments/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get comment with task and roadmap info
    const { data: comment, error: commentError } = await supabaseAdmin
      .from("roadmap_task_comments")
      .select(`
        author_id,
        task:roadmap_tasks(
          feature:roadmap_features(
            epic:roadmap_epics(
              roadmap:roadmaps(owner_id)
            )
          )
        )
      `)
      .eq("id", id)
      .single();

    if (commentError || !comment) {
      return res.status(404).json({
        error: { message: "Comment not found" },
      });
    }

    const roadmapOwnerId = comment.task?.feature?.epic?.roadmap?.owner_id;
    const isAuthor = comment.author_id === userId;
    const isRoadmapOwner = roadmapOwnerId === userId;

    if (!isAuthor && !isRoadmapOwner) {
      return res.status(403).json({
        error: { message: "You can only delete your own comments or comments on your roadmaps" },
      });
    }

    const { error } = await supabaseAdmin
      .from("roadmap_task_comments")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      data: { message: "Comment deleted successfully" },
    });
  } catch (error) {
    next(error);
  }
});

// ============= ATTACHMENTS =============

/**
 * GET /api/tasks/:taskId/attachments
 * Get all attachments for a task
 */
router.get("/tasks/:taskId/attachments", verifySupabaseJwt, readLimiter, async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("roadmap_task_attachments")
      .select(`
        *,
        uploader:profiles!roadmap_task_attachments_uploaded_by_fkey(id, full_name, avatar_url)
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:taskId/attachments
 * Add attachment metadata for a task
 * Note: Actual file upload to storage should be done client-side via Supabase Storage API
 */
router.post("/tasks/:taskId/attachments", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { file_name, file_path, file_type, file_size } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!file_name || typeof file_name !== "string") {
      return res.status(400).json({
        error: { message: "file_name is required" },
      });
    }

    if (!file_path || typeof file_path !== "string") {
      return res.status(400).json({
        error: { message: "file_path is required (the storage path)" },
      });
    }

    if (!file_type || typeof file_type !== "string") {
      return res.status(400).json({
        error: { message: "file_type is required" },
      });
    }

    if (file_size === undefined || typeof file_size !== "number" || file_size <= 0) {
      return res.status(400).json({
        error: { message: "file_size must be a positive number" },
      });
    }

    // Verify task exists and user has access
    const { data: task, error: taskError } = await supabaseAdmin
      .from("roadmap_tasks")
      .select("id")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return res.status(404).json({
        error: { message: "Task not found or access denied" },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("roadmap_task_attachments")
      .insert({
        task_id: taskId,
        uploaded_by: userId,
        file_name,
        file_path,
        file_type,
        file_size,
      })
      .select(`
        *,
        uploader:profiles!roadmap_task_attachments_uploaded_by_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/attachments/:id
 * Delete an attachment (uploader or roadmap owner)
 * Note: Client should also delete the file from Supabase Storage
 */
router.delete("/attachments/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get attachment with task and roadmap info
    const { data: attachment, error: attachmentError } = await supabaseAdmin
      .from("roadmap_task_attachments")
      .select(`
        uploaded_by,
        file_path,
        task:roadmap_tasks(
          feature:roadmap_features(
            epic:roadmap_epics(
              roadmap:roadmaps(owner_id)
            )
          )
        )
      `)
      .eq("id", id)
      .single();

    if (attachmentError || !attachment) {
      return res.status(404).json({
        error: { message: "Attachment not found" },
      });
    }

    const roadmapOwnerId = attachment.task?.feature?.epic?.roadmap?.owner_id;
    const isUploader = attachment.uploaded_by === userId;
    const isRoadmapOwner = roadmapOwnerId === userId;

    if (!isUploader && !isRoadmapOwner) {
      return res.status(403).json({
        error: { message: "You can only delete your own attachments or attachments on your roadmaps" },
      });
    }

    const { error } = await supabaseAdmin
      .from("roadmap_task_attachments")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      data: { 
        message: "Attachment metadata deleted successfully",
        file_path: attachment.file_path // Return path so client can delete from storage
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
