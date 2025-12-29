import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Transaction, TransactionFilters } from "@/types/wallet";

/**
 * Fetch transaction history for the current user
 */
export const useTransactions = (filters?: TransactionFilters) => {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: async (): Promise<Transaction[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      // First get the user's wallet ID
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (walletError || !wallet) {
        return [];
      }

      // Build query for transactions
      let query = supabase
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
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters?.type) {
        query = query.eq("type", filters.type);
      }

      if (filters?.projectId) {
        query = query.eq("project_id", filters.projectId);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        const start = filters.offset;
        const end = start + (filters.limit || 10) - 1;
        query = query.range(start, end);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    },
  });
};

/**
 * Fetch transactions for a specific project
 */
export const useProjectTransactions = (projectId: string) => {
  return useTransactions({ projectId });
};

/**
 * Fetch recent transactions (default 10)
 */
export const useRecentTransactions = (limit: number = 10) => {
  return useTransactions({ limit });
};

/**
 * Fetch transactions by type
 */
export const useTransactionsByType = (type: TransactionFilters["type"]) => {
  return useTransactions({ type });
};
