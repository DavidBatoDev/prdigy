import { Inject, Injectable } from '@nestjs/common';
export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY');
import type { AdminRepository } from './repositories/admin.repository.interface';
import {
  ApplicationsQueryDto,
  GrantAdminDto,
  MatchAssignDto,
  MatchCandidatesQueryDto,
  RejectApplicationDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: AdminRepository,
  ) {}

  getAdminProfile(userId: string) {
    return this.adminRepo.getAdminProfile(userId);
  }
  listApplications(query: ApplicationsQueryDto) {
    return this.adminRepo.listApplications(query);
  }
  getApplicationDetail(id: string) {
    return this.adminRepo.getApplicationDetail(id);
  }
  approveApplication(id: string) {
    return this.adminRepo.approveApplication(id);
  }
  rejectApplication(id: string, dto: RejectApplicationDto) {
    return this.adminRepo.rejectApplication(id, dto.reason);
  }
  listAdmins() {
    return this.adminRepo.listAdmins();
  }
  grantAdmin(userId: string, dto: GrantAdminDto) {
    return this.adminRepo.grantAdmin(userId, dto);
  }
  revokeAdmin(userId: string) {
    return this.adminRepo.revokeAdmin(userId);
  }
  getMatchCandidates(query: MatchCandidatesQueryDto) {
    return this.adminRepo.getMatchCandidates(query.project_id);
  }
  matchAssign(dto: MatchAssignDto) {
    return this.adminRepo.assignConsultant(dto.project_id, dto.consultant_id);
  }
  listProjects() {
    return this.adminRepo.listProjects();
  }
  listUsers() {
    return this.adminRepo.listUsers();
  }
}
