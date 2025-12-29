import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type {
  Wallet,
  FundEscrowResult,
  ReleaseMilestoneResult,
  RefundEscrowResult,
} from "@/types/wallet";

/**
 * Fetch current user's wallet
 */
export const useWallet = () => {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: async (): Promise<Wallet | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If wallet doesn't exist, return null
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data;
    },
  });
};

/**
 * Fund a payment checkpoint (lock funds in escrow)
 */
export const useFundEscrow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      checkpointId,
    }: {
      checkpointId: string;
    }): Promise<FundEscrowResult> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("fund_escrow", {
        p_checkpoint_id: checkpointId,
        p_client_user_id: user.id,
      });

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      // Invalidate wallet and transactions queries
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["payment-checkpoints"] });
    },
  });
};

/**
 * Release a milestone (distribute funds to platform/consultant/freelancer)
 */
export const useReleaseMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      checkpointId,
    }: {
      checkpointId: string;
    }): Promise<ReleaseMilestoneResult> => {
      const { data, error } = await supabase.rpc("release_milestone", {
        p_checkpoint_id: checkpointId,
      });

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["payment-checkpoints"] });
    },
  });
};

/**
 * Refund escrowed funds back to client
 */
export const useRefundEscrow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      checkpointId,
    }: {
      checkpointId: string;
    }): Promise<RefundEscrowResult> => {
      const { data, error } = await supabase.rpc("refund_escrow", {
        p_checkpoint_id: checkpointId,
      });

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["payment-checkpoints"] });
    },
  });
};

/**
 * Get wallet balance summary
 */
export const useWalletBalance = () => {
  const { data: wallet } = useWallet();

  if (!wallet) {
    return {
      available: 0,
      escrow: 0,
      total: 0,
      currency: "USD",
    };
  }

  return {
    available: wallet.available_balance,
    escrow: wallet.escrow_balance,
    total: wallet.available_balance + wallet.escrow_balance,
    currency: wallet.currency,
  };
};
