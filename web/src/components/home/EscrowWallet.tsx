export function EscrowWallet() {
  return (
    <div className="w-[35%]">
      <h2 className="text-[20px] font-semibold text-[#333438] mb-2">
        Escrow & Wallet
      </h2>
      <div className="bg-white rounded-xl shadow-sm p-8 relative overflow-hidden h-[280px]">
        <div className="absolute right-0 top-0 w-[105px] h-[105px] bg-[#ff9933] opacity-20 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="mb-8">
            <p className="text-[48px] leading-[40px] text-[#333438] mb-2">
              P80,000.00
            </p>
            <p className="text-[14px] text-[#92969f]">Secured in Escrow</p>
          </div>

          <div className="space-y-2 mb-8 text-[14px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#333438]">
                Pending Release:
              </span>
              <span className="text-[#333438]">P10,500.00</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#333438]">Total Spent:</span>
              <span className="text-[#333438]">P120,000.00</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="bg-[#ffad5c] hover:bg-[#ff9e42] text-white px-4 py-1 rounded-full text-[14px] shadow-sm transition-colors">
              + Add Funds
            </button>
            <button className="border border-[#ff993380] text-[#ffad5c] hover:bg-[#ff99331a] px-4 py-1 rounded-full text-[14px] transition-colors">
              Release Funds
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
