const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { verifySupabaseJwt } = require("../middleware/auth");
const { supabaseAdmin } = require("../lib/supabase");

// Rate limiter for read operations
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests. Please try again later.",
});

// Rate limiter for write operations
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: "Too many requests. Please try again later.",
});

/**
 * POST /api/roadmap-shares/:id
 * Create or update share configuration for a roadmap
 */
router.post("/:id", verifySupabaseJwt, writeLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { invitedEmails, defaultRole, expiresAt } = req.body;

    // Verify user is the roadmap owner
    const { data: roadmap, error: roadmapError } = await supabaseAdmin
      .from("roadmaps")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (roadmapError || !roadmap) {
      return res.status(404).json({
        error: { message: "Roadmap not found" },
      });
    }

    if (roadmap.owner_id !== req.user.id) {
      return res.status(403).json({
        error: { message: "Only the roadmap owner can manage sharing" },
      });
    }

    // Check if share already exists
    const { data: existingShare } = await supabaseAdmin
      .from("roadmap_shares")
      .select("*")
      .eq("roadmap_id", id)
      .eq("is_active", true)
      .single();

    let shareData;
    if (existingShare) {
      // Update existing share
      const { data, error } = await supabaseAdmin
        .from("roadmap_shares")
        .update({
          invited_emails: invitedEmails || [],
          default_role: defaultRole || "viewer",
          expires_at: expiresAt || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingShare.id)
        .select()
        .single();

      if (error) throw error;
      shareData = data;
    } else {
      // Create new share
      const { data, error } = await supabaseAdmin
        .from("roadmap_shares")
        .insert({
          roadmap_id: id,
          created_by: req.user.id,
          invited_emails: invitedEmails || [],
          default_role: defaultRole || "viewer",
          expires_at: expiresAt || null,
        })
        .select()
        .single();

      if (error) throw error;
      shareData = data;
    }

    // Construct share URL
    const shareUrl = `${req.protocol}://${req.get("host")}/roadmap/shared/${shareData.share_token}`;

    res.json({
      data: {
        ...shareData,
        share_url: shareUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/roadmap-shares/:id
 * Get current share settings for a roadmap
 */
router.get("/:id", verifySupabaseJwt, readLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify user is the roadmap owner
    const { data: roadmap, error: roadmapError } = await supabaseAdmin
      .from("roadmaps")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (roadmapError || !roadmap) {
      return res.status(404).json({
        error: { message: "Roadmap not found" },
      });
    }

    if (roadmap.owner_id !== req.user.id) {
      return res.status(403).json({
        error: { message: "Only the roadmap owner can view share settings" },
      });
    }

    const { data: shareData, error } = await supabaseAdmin
      .from("roadmap_shares")
      .select("*")
      .eq("roadmap_id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    if (shareData) {
      const shareUrl = `${req.protocol}://${req.get("host")}/roadmap/shared/${shareData.share_token}`;
      res.json({
        data: {
          ...shareData,
          share_url: shareUrl,
        },
      });
    } else {
      res.json({ data: null });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/roadmap-shares/:id
 * Disable sharing for a roadmap
 */
router.delete(
  "/:id",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Verify user is the roadmap owner
      const { data: roadmap, error: roadmapError } = await supabaseAdmin
        .from("roadmaps")
        .select("owner_id")
        .eq("id", id)
        .single();

      if (roadmapError || !roadmap) {
        return res.status(404).json({
          error: { message: "Roadmap not found" },
        });
      }

      if (roadmap.owner_id !== req.user.id) {
        return res.status(403).json({
          error: { message: "Only the roadmap owner can disable sharing" },
        });
      }

      const { error } = await supabaseAdmin
        .from("roadmap_shares")
        .update({ is_active: false })
        .eq("roadmap_id", id)
        .eq("is_active", true);

      if (error) throw error;

      res.json({
        data: { message: "Sharing disabled successfully" },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/roadmap-shares/token/:shareToken
 * Access a roadmap via public share link
 */
router.get("/token/:shareToken", readLimiter, async (req, res, next) => {
  try {
    const { shareToken } = req.params;

    // Find active share by token
    const { data: share, error: shareError } = await supabaseAdmin
      .from("roadmap_shares")
      .select("*")
      .eq("share_token", shareToken)
      .eq("is_active", true)
      .single();

    if (shareError || !share) {
      return res.status(404).json({
        error: { message: "Share link not found or expired" },
      });
    }

    // Check if share is expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.status(410).json({
        error: { message: "Share link has expired" },
      });
    }

    // Get full roadmap data (use same structure as /full endpoint)
    const { data: roadmap, error: roadmapError } = await supabaseAdmin
      .from("roadmaps")
      .select("*")
      .eq("id", share.roadmap_id)
      .single();

    if (roadmapError) throw roadmapError;

    // Get milestones
    const { data: milestones, error: milestonesError } = await supabaseAdmin
      .from("roadmap_milestones")
      .select("*")
      .eq("roadmap_id", roadmap.id)
      .order("position", { ascending: true });

    if (milestonesError) throw milestonesError;

    // Get epics
    const { data: epics, error: epicsError } = await supabaseAdmin
      .from("roadmap_epics")
      .select("*")
      .eq("roadmap_id", roadmap.id)
      .order("position", { ascending: true });

    if (epicsError) throw epicsError;

    // Get features
    const { data: features, error: featuresError } = await supabaseAdmin
      .from("roadmap_features")
      .select("*")
      .eq("roadmap_id", roadmap.id)
      .order("position", { ascending: true });

    if (featuresError) throw featuresError;

    // Get tasks
    const featureIds = features.map((f) => f.id);
    const { data: tasks, error: tasksError } = featureIds.length
      ? await supabaseAdmin
          .from("roadmap_tasks")
          .select("*")
          .in("feature_id", featureIds)
          .order("position", { ascending: true })
      : { data: [], error: null };

    if (tasksError) throw tasksError;

    // Determine user's role
    let userRole = share.default_role;
    if (req.user) {
      // User is authenticated, check for invited email match
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", req.user.id)
        .single();

      if (profile && share.invited_emails) {
        const invitedUser = share.invited_emails.find(
          (inv) => inv.email === profile.email,
        );
        if (invitedUser) {
          userRole = invitedUser.role;
        }
      }
    }

    // Structure the data
    const tasksByFeature = tasks.reduce((acc, task) => {
      if (!acc[task.feature_id]) acc[task.feature_id] = [];
      acc[task.feature_id].push(task);
      return acc;
    }, {});

    const featuresWithTasks = features.map((feature) => ({
      ...feature,
      tasks: tasksByFeature[feature.id] || [],
    }));

    const featuresByEpic = featuresWithTasks.reduce((acc, feature) => {
      if (!acc[feature.epic_id]) acc[feature.epic_id] = [];
      acc[feature.epic_id].push(feature);
      return acc;
    }, {});

    const epicsWithFeatures = epics.map((epic) => ({
      ...epic,
      features: featuresByEpic[epic.id] || [],
    }));

    res.json({
      data: {
        ...roadmap,
        currentUserRole: userRole,
        milestones,
        epics: epicsWithFeatures,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/roadmap-shares/shared-with-me
 * List roadmaps shared with the authenticated user via email invitation
 */
router.get(
  "/shared-with-me",
  verifySupabaseJwt,
  readLimiter,
  async (req, res, next) => {
    try {
      // Get user's email
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", req.user.id)
        .single();

      if (profileError) throw profileError;

      // Find all active shares where user's email is in invited_emails
      const { data: shares, error: sharesError } = await supabaseAdmin
        .from("roadmap_shares")
        .select("*, roadmaps(*)")
        .eq("is_active", true);

      if (sharesError) throw sharesError;

      // Filter shares to only those where user's email is invited
      const filteredShares = shares.filter((share) => {
        if (!share.invited_emails || !Array.isArray(share.invited_emails)) {
          return false;
        }
        return share.invited_emails.some((inv) => inv.email === profile.email);
      });

      // Get owner profiles
      const ownerIds = filteredShares.map((share) => share.roadmaps.owner_id);
      const { data: owners, error: ownersError } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, first_name, last_name, avatar_url")
        .in("id", ownerIds);

      if (ownersError) throw ownersError;

      const ownersById = owners.reduce((acc, owner) => {
        acc[owner.id] = owner;
        return acc;
      }, {});

      // Format response
      const data = filteredShares.map((share) => {
        const invitedUser = share.invited_emails.find(
          (inv) => inv.email === profile.email,
        );
        return {
          roadmap: share.roadmaps,
          owner: ownersById[share.roadmaps.owner_id],
          accessLevel: invitedUser?.role || "viewer",
          sharedAt: share.created_at,
        };
      });

      res.json({ data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/roadmap-shares/epic/:id/comments
 * Add a comment to an epic
 */
router.post(
  "/epic/:id/comments",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          error: { message: "Comment content is required" },
        });
      }

      // Insert comment (RLS will verify user has commenter/editor access)
      const { data, error } = await supabaseAdmin
        .from("epic_comments")
        .insert({
          epic_id: id,
          user_id: req.user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === "42501") {
          return res.status(403).json({
            error: {
              message: "You don't have permission to comment on this epic",
            },
          });
        }
        throw error;
      }

      // Fetch user profile for response
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, first_name, last_name, avatar_url")
        .eq("id", req.user.id)
        .single();

      res.json({
        data: {
          ...data,
          user: profile,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/roadmap-shares/feature/:id/comments
 * Add a comment to a feature
 */
router.post(
  "/feature/:id/comments",
  verifySupabaseJwt,
  writeLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          error: { message: "Comment content is required" },
        });
      }

      // Insert comment (RLS will verify user has commenter/editor access)
      const { data, error } = await supabaseAdmin
        .from("feature_comments")
        .insert({
          feature_id: id,
          user_id: req.user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === "42501") {
          return res.status(403).json({
            error: {
              message: "You don't have permission to comment on this feature",
            },
          });
        }
        throw error;
      }

      // Fetch user profile for response
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, first_name, last_name, avatar_url")
        .eq("id", req.user.id)
        .single();

      res.json({
        data: {
          ...data,
          user: profile,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
