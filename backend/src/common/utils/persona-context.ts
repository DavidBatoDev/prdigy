export type WorkspacePersona = 'client' | 'consultant' | 'freelancer';

export function normalizeWorkspacePersona(
  value?: string | null,
): WorkspacePersona | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'client' ||
    normalized === 'consultant' ||
    normalized === 'freelancer'
  ) {
    return normalized;
  }

  return null;
}

export function resolveRequestedPersona(
  headerPersona?: string | null,
  queryPersona?: string | null,
): WorkspacePersona | null {
  return (
    normalizeWorkspacePersona(headerPersona) ??
    normalizeWorkspacePersona(queryPersona)
  );
}

