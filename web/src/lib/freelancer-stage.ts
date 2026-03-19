import type { Profile } from "@/types";

export type FreelancerStage = "onboarding" | "matching" | "assigned" | "active-work";

interface StageSignals {
  hasAssignedWork?: boolean;
  hasConfirmedMatch?: boolean;
}

export function getFreelancerStage(
  profile: Profile | null,
  signals?: StageSignals,
): FreelancerStage {
  if (!profile || profile.active_persona !== "freelancer") {
    return "onboarding";
  }

  if (!profile.has_completed_onboarding) {
    return "onboarding";
  }

  if (signals?.hasAssignedWork) {
    return "active-work";
  }

  if (signals?.hasConfirmedMatch) {
    return "assigned";
  }

  return "matching";
}

export function getStageMeta(stage: FreelancerStage): {
  label: string;
  systemLine: string;
  nextAction: string;
  progressPercent: number;
} {
  switch (stage) {
    case "onboarding":
      return {
        label: "Stage 1: Onboarding",
        systemLine: "Activation details are being prepared.",
        nextAction: "Complete your profile to enter matching.",
        progressPercent: 25,
      };
    case "matching":
      return {
        label: "Stage 2: Matching",
        systemLine: "Consultants are reviewing your profile for active projects.",
        nextAction: "Keep profile details current to increase shortlist speed.",
        progressPercent: 55,
      };
    case "assigned":
      return {
        label: "Stage 3: Assigned",
        systemLine: "Your assignment is confirmed and workspace setup is in progress.",
        nextAction: "Open your roadmap and review your first milestone.",
        progressPercent: 75,
      };
    case "active-work":
      return {
        label: "Stage 4: Active Work",
        systemLine: "Delivery is active and milestone tracking is running.",
        nextAction: "Focus on top-priority work for today.",
        progressPercent: 95,
      };
    default:
      return {
        label: "Stage 1: Onboarding",
        systemLine: "Activation details are being prepared.",
        nextAction: "Complete your profile to enter matching.",
        progressPercent: 25,
      };
  }
}
