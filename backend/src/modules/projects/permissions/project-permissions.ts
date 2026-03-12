export type ProjectPermissions = {
  roadmap: {
    edit: boolean;
    view_internal: boolean;
    comment: boolean;
    promote: boolean;
  };
  members: {
    manage: boolean;
    view: boolean;
  };
  project: {
    settings: boolean;
    transfer: boolean;
  };
  time: {
    manage_rates: boolean;
    view: boolean;
  };
};

export const PERMISSION_TEMPLATES = {
  client: {
    roadmap: {
      edit: false,
      view_internal: false,
      comment: true,
      promote: false,
    },
    members: { manage: true, view: true },
    project: { settings: true, transfer: true },
    time: { manage_rates: false, view: false },
  },
  consultant: {
    roadmap: { edit: true, view_internal: true, comment: true, promote: true },
    members: { manage: true, view: true },
    project: { settings: true, transfer: false },
    time: { manage_rates: true, view: true },
  },
  consultant_incubation: {
    roadmap: { edit: true, view_internal: true, comment: true, promote: true },
    members: { manage: true, view: true },
    project: { settings: true, transfer: true },
    time: { manage_rates: true, view: true },
  },
  member: {
    roadmap: {
      edit: false,
      view_internal: false,
      comment: true,
      promote: false,
    },
    members: { manage: false, view: false },
    project: { settings: false, transfer: false },
    time: { manage_rates: false, view: false },
  },
} satisfies Record<string, ProjectPermissions>;

export type PermissionTemplateKey = keyof typeof PERMISSION_TEMPLATES;

export type ProjectMemberLike = {
  id: string;
  user_id: string | null;
  role: string;
  permissions_json?: Record<string, unknown> | null;
};

export type ProjectLike = {
  id: string;
  client_id: string;
  consultant_id?: string | null;
};

export function clonePermissions(
  template: ProjectPermissions,
): ProjectPermissions {
  return {
    roadmap: { ...template.roadmap },
    members: { ...template.members },
    project: { ...template.project },
    time: { ...template.time },
  };
}

export function getTemplateByKey(
  key: PermissionTemplateKey,
): ProjectPermissions {
  return clonePermissions(PERMISSION_TEMPLATES[key]);
}

export function isPermissionsEmpty(
  permissions: Record<string, unknown> | null | undefined,
): boolean {
  if (!permissions) return true;
  return Object.keys(permissions).length === 0;
}

export function resolvePermissionTemplateKey(
  project: ProjectLike,
  member: ProjectMemberLike,
): PermissionTemplateKey {
  if (member.user_id && member.user_id === project.consultant_id) {
    return 'consultant';
  }

  if (member.user_id && member.user_id === project.client_id) {
    return 'client';
  }

  const normalizedRole = String(member.role || '')
    .trim()
    .toLowerCase();

  if (normalizedRole === 'consultant') {
    return 'consultant';
  }

  if (normalizedRole === 'client') {
    return 'client';
  }

  return 'member';
}

export function hasPermission(
  permissions: ProjectPermissions,
  path:
    | 'members.manage'
    | 'members.view'
    | 'project.settings'
    | 'project.transfer'
    | 'roadmap.edit'
    | 'roadmap.view_internal'
    | 'roadmap.comment'
    | 'roadmap.promote'
    | 'time.manage_rates'
    | 'time.view',
): boolean {
  const [section, key] = path.split('.') as [keyof ProjectPermissions, string];
  const group = permissions[section] as Record<string, boolean>;
  return group?.[key] === true;
}
