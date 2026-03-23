import { useAuthStore } from "@/stores/authStore";

export type ActivePersona = "client" | "consultant" | "freelancer";

export function getActivePersonaForRequest(): ActivePersona | null {
  const profile = useAuthStore.getState().profile;
  const persona = String(profile?.active_persona ?? "").toLowerCase();
  if (
    persona === "client" ||
    persona === "consultant" ||
    persona === "freelancer"
  ) {
    return persona;
  }
  return null;
}

