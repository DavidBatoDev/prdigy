import type { AxiosError } from "axios";

const RATE_REQUIRED_HINT = "not enabled for time tracking";

export const projectTimeKeys = {
  all: ["project-time"] as const,
  permissions: (projectId: string, actorKey: string) =>
    ["project-time", "permissions", projectId, actorKey] as const,
  myLogs: (projectId: string, actorKey: string, page: number, limit: number) =>
    ["project-time", "my-logs", projectId, actorKey, page, limit] as const,
  myRate: (projectId: string, actorKey: string) =>
    ["project-time", "my-rate", projectId, actorKey] as const,
  tasks: (projectId: string, actorKey: string) =>
    ["project-time", "tasks", projectId, actorKey] as const,
  rates: (projectId: string, actorKey: string) =>
    ["project-time", "rates", projectId, actorKey] as const,
  teamMembers: (projectId: string, actorKey: string) =>
    ["project-time", "team-members", projectId, actorKey] as const,
};

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

export function isForbiddenError(error: unknown): boolean {
  const maybeAxiosError = error as AxiosError | undefined;
  return maybeAxiosError?.response?.status === 403;
}

export function isRateRequiredError(error: unknown): boolean {
  const message = getErrorMessage(error, "").toLowerCase();
  return message.includes(RATE_REQUIRED_HINT);
}
