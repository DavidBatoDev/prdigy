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

/**
 * POST /api/payments/:id/fund
 * Fund a payment checkpoint (lock funds in escrow) - Client only
 */
router.post("/:id/fund", verifySupabaseJwt, async (req, res, next) => {
  try {
    const checkpointId = req.params.id;
    const userId = req.user.id;

    // Call the fund_escrow database function
    const { data, error } = await supabaseAdmin.rpc("fund_escrow", {
      p_checkpoint_id: checkpointId,
      p_client_user_id: userId,
    });

    if (error) {
      return res.status(400).json({
        error: {
          message: error.message || "Failed to fund escrow",
        },
      });
    }

    res.json({
      message: "Funds successfully locked in escrow",
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/:id/release
 * Release milestone payment (cascade to platform/consultant/freelancer) - Consultant or Admin only
 */
router.post(
  "/:id/release",
  verifySupabaseJwt,
  requirePersona("consultant", "admin"),
  async (req, res, next) => {
    try {
      const checkpointId = req.params.id;

      // Call the release_milestone database function
      const { data, error } = await supabaseAdmin.rpc("release_milestone", {
        p_checkpoint_id: checkpointId,
      });

      if (error) {
        return res.status(400).json({
          error: {
            message: error.message || "Failed to release milestone",
          },
        });
      }

      res.json({
        message: "Milestone released successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/payments/:id/refund
 * Refund escrowed funds back to client - Consultant or Admin only
 */
router.post(
  "/:id/refund",
  verifySupabaseJwt,
  requirePersona("consultant", "admin"),
  async (req, res, next) => {
    try {
      const checkpointId = req.params.id;

      // Call the refund_escrow database function
      const { data, error } = await supabaseAdmin.rpc("refund_escrow", {
        p_checkpoint_id: checkpointId,
      });

      if (error) {
        return res.status(400).json({
          error: {
            message: error.message || "Failed to refund escrow",
          },
        });
      }

      res.json({
        message: "Escrow refunded successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/payments/wallet
 * Get current user's wallet
 */
router.get("/wallet", verifySupabaseJwt, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If wallet doesn't exist yet, return zeros
      if (error.code === "PGRST116") {
        return res.json({
          data: {
            available_balance: 0,
            escrow_balance: 0,
            currency: "USD",
          },
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
 * GET /api/payments/wallet/transactions
 * Get transaction history for current user
 */
router.get(
  "/wallet/transactions",
  verifySupabaseJwt,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { type, project_id, limit = 50, offset = 0 } = req.query;

      // First get the user's wallet ID
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from("wallets")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (walletError || !wallet) {
        return res.json({ data: [] });
      }

      // Build query for transactions
      let query = supabaseAdmin
        .from("transactions")
        .select(
          `
        *,
        project:projects (
          id,
          title
        ),
        checkpoint:payment_checkpoints (
          id,
          description
        )
      `
        )
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })
        .limit(parseInt(limit))
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (type) {
        query = query.eq("type", type);
      }

      if (project_id) {
        query = query.eq("project_id", project_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/payments/wallet/admin/deposit
 * Admin only: Add funds to a user's wallet (for testing and manual adjustments)
 */
router.post(
  "/wallet/admin/deposit",
  verifySupabaseJwt,
  requirePersona("admin"),
  async (req, res, next) => {
    try {
      const { user_id, amount, description } = req.body;

      if (!user_id || !amount) {
        return res.status(400).json({
          error: {
            message: "Missing required fields: user_id, amount",
          },
        });
      }

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from("wallets")
        .select("id")
        .eq("user_id", user_id)
        .single();

      if (walletError) {
        return res.status(404).json({
          error: {
            message: "Wallet not found for user",
          },
        });
      }

      // Update balance
      const { data: updatedWallet, error: updateError } = await supabaseAdmin
        .from("wallets")
        .update({
          available_balance: supabaseAdmin.raw(
            `available_balance + ${parseFloat(amount)}`
          ),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Record transaction
      const { error: txError } = await supabaseAdmin
        .from("transactions")
        .insert({
          wallet_id: wallet.id,
          amount: parseFloat(amount),
          type: "deposit",
          description: description || "Admin deposit",
          metadata: {
            admin_id: req.user.id,
            admin_action: true,
          },
        });

      if (txError) throw txError;

      res.json({
        message: "Deposit successful",
        data: updatedWallet,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
