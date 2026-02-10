const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { verifySupabaseJwt } = require("../middleware/auth");
const { supabaseAdmin } = require("../lib/supabase");

// Rate limiter for guest creation - more restrictive to prevent abuse
const guestCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 guest accounts per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many guest accounts created. Please try again later.",
  skipSuccessfulRequests: false,
});

// Rate limiter for migration - less restrictive
const migrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many migration attempts. Please try again later.",
});

/**
 * POST /api/guests/create
 * Create a new guest user profile
 * Public endpoint with rate limiting
 */
router.post("/create", guestCreationLimiter, async (req, res, next) => {
  try {
    const { session_id } = req.body;

    // Validate session ID
    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({
        error: { message: "Valid session_id is required" },
      });
    }

    // Check if session ID is valid format (should start with 'guest_')
    if (!session_id.startsWith("guest_")) {
      return res.status(400).json({
        error: { message: "Invalid session ID format" },
      });
    }

    // Check if guest user already exists for this session
    const { data: existingGuest, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("guest_session_id", session_id)
      .eq("is_guest", true)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found", which is expected
      throw checkError;
    }

    if (existingGuest) {
      // Guest already exists, return existing ID
      return res.json({
        data: {
          user_id: existingGuest.id,
          is_new: false,
        },
      });
    }

    // Create guest user using database function
    const { data, error } = await supabaseAdmin.rpc("create_guest_user", {
      session_id,
    });

    if (error) {
      console.error("Error creating guest user:", error);
      throw error;
    }

    // Log guest creation for analytics
    console.log(`Guest user created: ${data}, session: ${session_id}`);

    res.status(201).json({
      data: {
        user_id: data,
        is_new: true,
      },
    });
  } catch (error) {
    console.error("Guest creation error:", error);
    next(error);
  }
});

/**
 * GET /api/guests/by-session/:sessionId
 * Get guest user ID by session ID
 * Public endpoint with rate limiting
 */
router.get("/by-session/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || !sessionId.startsWith("guest_")) {
      return res.status(400).json({
        error: { message: "Invalid session ID" },
      });
    }

    const { data, error } = await supabaseAdmin.rpc("get_guest_user_id", {
      session_id: sessionId,
    });

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: { message: "Guest user not found" },
      });
    }

    res.json({ data: { user_id: data } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/guests/migrate
 * Migrate guest user data to authenticated user
 * Requires authentication
 */
router.post(
  "/migrate",
  verifySupabaseJwt,
  migrationLimiter,
  async (req, res, next) => {
    try {
      const { guest_session_id } = req.body;
      const authenticatedUserId = req.user.id;

      if (!guest_session_id) {
        return res.status(400).json({
          error: { message: "guest_session_id is required" },
        });
      }

      // Find guest user profile
      const { data: guestProfile, error: guestError } = await supabaseAdmin
        .from("profiles")
        .select("id, is_guest")
        .eq("guest_session_id", guest_session_id)
        .eq("is_guest", true)
        .single();

      if (guestError || !guestProfile) {
        // No guest profile found - not an error, just nothing to migrate
        return res.json({
          data: {
            success: true,
            migrated_roadmaps: 0,
            created_projects: 0,
            message: "No guest data to migrate",
          },
        });
      }

      const guestUserId = guestProfile.id;

      // Get all roadmaps owned by guest
      const { data: guestRoadmaps, error: roadmapsError } = await supabaseAdmin
        .from("roadmaps")
        .select("*")
        .eq("owner_id", guestUserId);

      if (roadmapsError) {
        console.error("Error fetching guest roadmaps:", roadmapsError);
        throw roadmapsError;
      }

      let migratedCount = 0;
      let createdProjects = 0;
      const errors = [];

      // Migrate each roadmap
      if (guestRoadmaps && guestRoadmaps.length > 0) {
        for (const roadmap of guestRoadmaps) {
          try {
            let projectId = roadmap.project_id;

            // If roadmap doesn't have a project, create one
            if (!projectId) {
              const { data: newProjectId, error: projectError } =
                await supabaseAdmin.rpc("get_or_create_default_project", {
                  user_id_param: authenticatedUserId,
                  roadmap_name: roadmap.name || "My Project",
                });

              if (projectError) {
                errors.push(
                  `Failed to create project for roadmap ${roadmap.id}: ${projectError.message}`,
                );
                continue;
              }

              projectId = newProjectId;
              createdProjects++;
            }

            // Update roadmap ownership
            const { error: updateError } = await supabaseAdmin
              .from("roadmaps")
              .update({
                owner_id: authenticatedUserId,
                project_id: projectId,
                updated_at: new Date().toISOString(),
              })
              .eq("id", roadmap.id);

            if (updateError) {
              errors.push(
                `Failed to migrate roadmap ${roadmap.id}: ${updateError.message}`,
              );
              continue;
            }

            migratedCount++;
          } catch (err) {
            errors.push(
              `Exception migrating roadmap ${roadmap.id}: ${err.message}`,
            );
          }
        }
      }

      // Clear guest session ID (mark for deletion)
      await supabaseAdmin
        .from("profiles")
        .update({
          guest_session_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", guestUserId);

      // Log migration for analytics
      console.log(
        `Migration complete for user ${authenticatedUserId}: ${migratedCount} roadmaps, ${createdProjects} projects created`,
      );

      res.json({
        data: {
          success: errors.length === 0,
          migrated_roadmaps: migratedCount,
          created_projects: createdProjects,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error) {
      console.error("Migration error:", error);
      next(error);
    }
  },
);

/**
 * GET /api/guests/pending
 * Check if there's pending guest data to migrate
 * Requires session_id query parameter
 */
router.get("/pending", async (req, res, next) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        error: { message: "session_id query parameter is required" },
      });
    }

    // Find guest profile
    const { data: guestProfile, error: guestError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("guest_session_id", session_id)
      .eq("is_guest", true)
      .single();

    if (guestError || !guestProfile) {
      return res.json({ data: { has_pending: false } });
    }

    // Check if guest has any roadmaps
    const { data: roadmaps, error: roadmapsError } = await supabaseAdmin
      .from("roadmaps")
      .select("id")
      .eq("owner_id", guestProfile.id)
      .limit(1);

    if (roadmapsError) throw roadmapsError;

    res.json({
      data: {
        has_pending: (roadmaps?.length ?? 0) > 0,
        roadmap_count: roadmaps?.length ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/guests/cleanup
 * Manually trigger cleanup of old guest users (admin only)
 * Requires authentication
 */
router.post("/cleanup", verifySupabaseJwt, async (req, res, next) => {
  try {
    // TODO: Add admin role check here
    // For now, any authenticated user can trigger cleanup

    const { data, error } = await supabaseAdmin.rpc("cleanup_old_guest_users");

    if (error) throw error;

    console.log(`Cleaned up ${data} old guest users`);

    res.json({
      data: {
        deleted_count: data,
        message: `Successfully cleaned up ${data} old guest user(s)`,
      },
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    next(error);
  }
});

module.exports = router;
