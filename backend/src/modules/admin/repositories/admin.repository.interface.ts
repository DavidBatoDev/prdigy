export interface AdminRepository {
  getAdminProfile(userId: string): Promise<unknown>;
  listApplications(filters: { status?: string }): Promise<unknown[]>;
  getApplicationDetail(id: string): Promise<unknown>;
  approveApplication(id: string): Promise<unknown>;
  rejectApplication(id: string, reason?: string): Promise<unknown>;
  listAdmins(): Promise<unknown[]>;
  grantAdmin(
    userId: string,
    data: { access_level?: string; department?: string },
  ): Promise<unknown>;
  revokeAdmin(userId: string): Promise<void>;
  getMatchCandidates(projectId: string): Promise<unknown[]>;
  assignConsultant(projectId: string, consultantId: string): Promise<unknown>;
  listProjects(): Promise<unknown[]>;
  listUsers(): Promise<unknown[]>;
}
