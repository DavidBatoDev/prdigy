import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/project/$projectId/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-[#ff9933]" />
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Track and manage all payments for this project.
          </p>
        </div>
        <button
          disabled
          className="px-4 py-2.5 bg-[#ff9933] text-white text-sm font-semibold rounded-lg hover:bg-[#e68829] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Add Payment
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff9933]/10 flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-[#ff9933]" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No payments yet</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Add payments to track invoices, milestones, and billing for this project.
        </p>
      </div>
    </div>
  );
}
