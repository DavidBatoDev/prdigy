import { useWallet, useWalletBalance } from "@/queries/wallet";
import { useTransactions } from "@/queries/transactions";

export function EscrowWallet() {
  const { data: wallet, isLoading } = useWallet();
  const walletBalance = useWalletBalance();
  const { data: transactions = [] } = useTransactions({ limit: 100 });

  // Calculate total spent from completed transactions
  const totalSpent = transactions
    .filter(
      (t) =>
        t.type === "escrow_release" ||
        t.type === "freelancer_payout" ||
        t.type === "withdrawal"
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: walletBalance.currency || "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="w-[35%]">
        <h2 className="text-[20px] font-semibold text-[#333438] mb-2">
          Escrow & Wallet
        </h2>
        <div className="bg-white rounded-xl shadow-sm p-8 h-[280px] flex flex-col relative overflow-hidden">
          {/* Skeleton Content */}
          <div className="animate-pulse relative z-10 w-full">
            {/* Escrow Amount - Large Block */}
            <div className="h-12 w-48 bg-gray-200 rounded-md mb-3" />
            
            {/* Label - Small Block */}
            <div className="h-4 w-32 bg-gray-100 rounded-md mb-9" />
            
            {/* Details Rows */}
            <div className="space-y-3 mb-9">
              <div className="flex items-center gap-2">
                <div className="h-4 w-56 bg-gray-100 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                 <div className="h-4 w-40 bg-gray-100 rounded-md" />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <div className="h-8 w-28 bg-gray-200 rounded-full" />
              <div className="h-8 w-36 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="w-[35%]">
        <h2 className="text-[20px] font-semibold text-[#333438] mb-2">
          Escrow & Wallet
        </h2>
        <div className="bg-white rounded-xl shadow-sm p-8 h-[280px] flex items-center justify-center">
          <p className="text-[#92969f]">No wallet found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[35%]">
      <h2 className="text-[20px] font-semibold text-[#333438] mb-2">
        Escrow & Wallet
      </h2>
      <div className="bg-white rounded-xl shadow-sm p-8 relative overflow-hidden h-[280px]">
        <div className="absolute right-0 top-0 w-[105px] h-[105px] bg-[#ff9933] opacity-20 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="mb-8">
            <p className="text-[48px] leading-10 text-[#333438] mb-2">
              {formatCurrency(walletBalance.escrow)}
            </p>
            <p className="text-[14px] text-[#92969f]">Secured in Escrow</p>
          </div>

          <div className="space-y-2 mb-8 text-[14px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#333438]">
                Available Balance:
              </span>
              <span className="text-[#333438]">
                {formatCurrency(walletBalance.available)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#333438]">Total Spent:</span>
              <span className="text-[#333438]">
                {formatCurrency(totalSpent)}
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="bg-[#ffad5c] hover:bg-[#ff9e42] text-white px-4 py-1 rounded-full text-[14px] shadow-sm transition-colors">
              + Add Funds
            </button>
            <button className="border border-[#ff993380] text-[#ffad5c] hover:bg-[#ff99331a] px-4 py-1 rounded-full text-[14px] transition-colors">
              View Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
