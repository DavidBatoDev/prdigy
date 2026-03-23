import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import { useAuthStore } from "@/stores/authStore";
import {
  fetchLinkedRoadmap,
  fetchProject,
  fetchProjectBrief,
  fetchProjectMembers,
  fetchProjectResources,
  fetchRoadmapFull,
  projectKeys,
} from "@/queries/project";

const STALE_30S = 30 * 1000;
const STALE_60S = 60 * 1000;

export function useProjectDetailQuery(projectId: string) {
  const persona = useAuthStore((state) => state.profile?.active_persona || "client");
  return useQuery({
    queryKey: projectKeys.detail(projectId, persona),
    queryFn: () => fetchProject(projectId),
    enabled: Boolean(projectId),
    staleTime: STALE_60S,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useProjectMembersQuery(projectId: string) {
  const persona = useAuthStore((state) => state.profile?.active_persona || "client");
  return useQuery({
    queryKey: projectKeys.members(projectId, persona),
    queryFn: () => fetchProjectMembers(projectId),
    enabled: Boolean(projectId),
    staleTime: STALE_60S,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useProjectResourcesQuery(projectId: string) {
  const persona = useAuthStore((state) => state.profile?.active_persona || "client");
  return useQuery({
    queryKey: projectKeys.resources(projectId, persona),
    queryFn: () => fetchProjectResources(projectId),
    enabled: Boolean(projectId),
    staleTime: STALE_30S,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useLinkedRoadmapQuery(projectId: string) {
  const persona = useAuthStore((state) => state.profile?.active_persona || "client");
  return useQuery({
    queryKey: projectKeys.linkedRoadmap(projectId, persona),
    queryFn: () => fetchLinkedRoadmap(projectId),
    enabled: Boolean(projectId),
    staleTime: STALE_60S,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useProjectBriefQuery(projectId: string) {
  const persona = useAuthStore((state) => state.profile?.active_persona || "client");
  return useQuery({
    queryKey: projectKeys.brief(projectId, persona),
    queryFn: () => fetchProjectBrief(projectId),
    enabled: Boolean(projectId),
    staleTime: STALE_60S,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useRoadmapFullQuery(roadmapId: string) {
  const persona = useAuthStore((state) => state.profile?.active_persona || "client");
  return useQuery({
    queryKey: projectKeys.roadmapFull(roadmapId, persona),
    queryFn: () => fetchRoadmapFull(roadmapId),
    enabled: Boolean(roadmapId),
    staleTime: STALE_30S,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useRoadmapFullLiveQuery(roadmapId: string) {
  const persona = useAuthStore((state) => state.profile?.active_persona || "client");
  return useQuery({
    queryKey: projectKeys.roadmapFull(roadmapId, persona),
    queryFn: () => fetchRoadmapFull(roadmapId),
    enabled: Boolean(roadmapId),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });
}

export function useProjectInviteMemberMutation(projectId: string) {
  const queryClient = useQueryClient();
  const persona = useAuthStore((state) => state.profile?.active_persona || "client");

  return useMutation({
    mutationFn: (payload: { email: string; position: string; message?: string }) =>
      projectService.inviteByEmail(projectId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId, persona) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId, persona) });
    },
  });
}

export function useProjectRemoveMemberMutation(projectId: string) {
  const queryClient = useQueryClient();
  const persona = useAuthStore((state) => state.profile?.active_persona || "client");

  return useMutation({
    mutationFn: (memberId: string) => projectService.removeMember(projectId, memberId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId, persona) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId, persona) });
    },
  });
}

export function useInvalidateProjectQueries(projectId: string) {
  const queryClient = useQueryClient();
  const persona = useAuthStore((state) => state.profile?.active_persona || "client");

  return {
    invalidateProject: () =>
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId, persona) }),
    invalidateMembers: () =>
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId, persona) }),
    invalidateResources: () =>
      queryClient.invalidateQueries({ queryKey: projectKeys.resources(projectId, persona) }),
    invalidateLinkedRoadmap: () =>
      queryClient.invalidateQueries({ queryKey: projectKeys.linkedRoadmap(projectId, persona) }),
    invalidateBrief: () =>
      queryClient.invalidateQueries({ queryKey: projectKeys.brief(projectId, persona) }),
  };
}
