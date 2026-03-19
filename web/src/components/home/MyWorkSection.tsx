import { useAuthStore } from "@/stores/authStore";
import { getFreelancerStage } from "@/lib/freelancer-stage";

type WorkItem = {
  id: string;
  title: string;
  type: "Task" | "Milestone";
  dueLabel: string;
};

export function MyWorkSection() {
  const { profile } = useAuthStore();
  const persona = profile?.active_persona || "client";

  if (persona !== "freelancer") return null;

  const items: WorkItem[] = [];
  const stage = getFreelancerStage(profile, { hasAssignedWork: items.length > 0 });
  const topFocus =
    stage === "active-work"
      ? "Complete the highest-priority milestone task before your next check-in."
      : stage === "assigned"
        ? "Review your assigned roadmap and confirm your first execution task."
        : stage === "matching"
          ? "Stay match-ready: refine your headline, core skills, and availability."
          : "Complete activation details to unlock matching and daily work.";

  return (
    <section className="bg-white rounded-xl shadow-sm p-6" data-tutorial="freelancer-my-work-section">
      <div className="mb-3">
        <h2 className="text-[20px] font-semibold text-[#333438]">My Work</h2>
        <p className="text-xs text-[#61636c]">
          Assigned execution tasks and milestone responsibilities
        </p>
      </div>

      <div className="bg-[#f6f7f8] rounded-lg p-4 mb-3">
        <p className="text-xs font-semibold text-[#61636c] mb-1">TODAY'S FOCUS</p>
        <p className="text-sm font-semibold text-[#333438]">{topFocus}</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-[#f6f7f8] rounded-lg p-4">
          <p className="text-sm font-semibold text-[#333438] mb-1">Your first assignment is in motion</p>
          <p className="text-xs text-[#61636c]">
            Consultant matching is currently staffing roadmap roles. As soon as you are placed, tasks and milestone responsibilities appear here in real time.
          </p>
          <p className="text-[11px] text-[#61636c] mt-2">Matching in progress...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full text-left bg-[#f6f7f8] rounded-lg p-3 flex items-center justify-between gap-2"
            >
              <div>
                <p className="text-sm font-medium text-[#333438]">{item.title}</p>
                <p className="text-xs text-[#61636c]">{item.type}</p>
              </div>
              <span className="text-[11px] text-[#61636c]">{item.dueLabel}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
