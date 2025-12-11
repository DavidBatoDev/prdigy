const express = require("express");
const router = express.Router();
const { verifySupabaseJwt, requirePersona } = require("../middleware/auth");
const { supabaseAdmin } = require("../lib/supabase");

/**
 * GET /api/payments/project/:projectId
 * Get all payment checkpoints for a project
 */
router.get("/project/:projectId", verifySupabaseJwt, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("payment_checkpoints")
      .select(
        `
        *,
        milestone:milestones (
          id,
          title
        ),
        payer:profiles!payment_checkpoints_payer_id_fkey (
          id,
          display_name,
          avatar_url
        ),
        payee:profiles!payment_checkpoints_payee_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `
      )
      .eq("project_id", req.params.projectId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments
 * Create a payment checkpoint (Consultant or Admin only)
 */
router.post(
  "/",
  verifySupabaseJwt,
  requirePersona("consultant", "admin"),
  async (req, res, next) => {
    try {
      const {
        project_id,
        milestone_id,
        amount,
        payer_id,
        payee_id,
        description,
      } = req.body;

      if (!project_id || !amount || !payer_id || !payee_id) {
        return res.status(400).json({
          error: {
            message:
              "Missing required fields: project_id, amount, payer_id, payee_id",
          },
        });
      }

      const { data, error } = await supabaseAdmin
        .from("payment_checkpoints")
        .insert({
          project_id,
          milestone_id,
          amount,
          payer_id,
          payee_id,
          description,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/payments/:id/complete
 * Mark a payment checkpoint as completed (Consultant or Admin only)
 */
router.patch(
  "/:id/complete",
  verifySupabaseJwt,
  requirePersona("consultant", "admin"),
  async (req, res, next) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("payment_checkpoints")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
