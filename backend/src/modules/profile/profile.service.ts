import { Inject, Injectable, NotFoundException } from '@nestjs/common';
export const PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY');
import type {
  ProfileRepository,
  FullProfile,
} from './repositories/profile.repository.interface';
import {
  UpdateProfileBasicDto,
  ReplaceSkillsDto,
  AddLanguageDto,
  UpdateLanguageDto,
  AddEducationDto,
  UpdateEducationDto,
  AddCertificationDto,
  UpdateCertificationDto,
  AddExperienceDto,
  UpdateExperienceDto,
  AddPortfolioDto,
  UpdatePortfolioDto,
  UpsertRateSettingsDto,
  AddLicenseDto,
  UpdateLicenseDto,
  AddSpecializationDto,
  UpdateSpecializationDto,
  AddIdentityDocumentDto,
} from './dto/profile.dto';
import {
  Skill,
  Language,
  UserSkill,
  UserLanguage,
  UserEducation,
  UserCertification,
  UserExperience,
  UserPortfolio,
  UserLicense,
  UserSpecialization,
  UserRateSettings,
  UserIdentityDocument,
} from '../../common/entities';

@Injectable()
export class ProfileService {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly profileRepo: ProfileRepository,
  ) {}

  async getFullProfile(userId: string): Promise<FullProfile> {
    const profile = await this.profileRepo.getFullProfile(userId);
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateBasic(userId: string, dto: UpdateProfileBasicDto) {
    return this.profileRepo.updateBasic(userId, dto);
  }

  async getAllSkills(): Promise<Skill[]> {
    return this.profileRepo.getAllSkills();
  }

  async getAllLanguages(): Promise<Language[]> {
    return this.profileRepo.getAllLanguages();
  }

  async replaceSkills(
    userId: string,
    dto: ReplaceSkillsDto,
  ): Promise<UserSkill[]> {
    return this.profileRepo.replaceUserSkills(userId, dto.skills);
  }

  async addLanguage(
    userId: string,
    dto: AddLanguageDto,
  ): Promise<UserLanguage> {
    return this.profileRepo.addLanguage(userId, dto);
  }

  async updateLanguage(
    id: string,
    userId: string,
    dto: UpdateLanguageDto,
  ): Promise<UserLanguage> {
    return this.profileRepo.updateLanguage(id, userId, dto);
  }

  async deleteLanguage(id: string, userId: string): Promise<void> {
    return this.profileRepo.deleteLanguage(id, userId);
  }

  async addEducation(
    userId: string,
    dto: AddEducationDto,
  ): Promise<UserEducation> {
    return this.profileRepo.addEducation(userId, dto);
  }

  async updateEducation(
    id: string,
    userId: string,
    dto: UpdateEducationDto,
  ): Promise<UserEducation> {
    return this.profileRepo.updateEducation(id, userId, dto);
  }

  async deleteEducation(id: string, userId: string): Promise<void> {
    return this.profileRepo.deleteEducation(id, userId);
  }

  async addCertification(
    userId: string,
    dto: AddCertificationDto,
  ): Promise<UserCertification> {
    return this.profileRepo.addCertification(userId, dto);
  }

  async updateCertification(
    id: string,
    userId: string,
    dto: UpdateCertificationDto,
  ): Promise<UserCertification> {
    return this.profileRepo.updateCertification(id, userId, dto);
  }

  async deleteCertification(id: string, userId: string): Promise<void> {
    return this.profileRepo.deleteCertification(id, userId);
  }

  async addExperience(
    userId: string,
    dto: AddExperienceDto,
  ): Promise<UserExperience> {
    return this.profileRepo.addExperience(userId, dto);
  }

  async updateExperience(
    id: string,
    userId: string,
    dto: UpdateExperienceDto,
  ): Promise<UserExperience> {
    return this.profileRepo.updateExperience(id, userId, dto);
  }

  async deleteExperience(id: string, userId: string): Promise<void> {
    return this.profileRepo.deleteExperience(id, userId);
  }

  async addPortfolio(
    userId: string,
    dto: AddPortfolioDto,
  ): Promise<UserPortfolio> {
    return this.profileRepo.addPortfolio(userId, dto);
  }

  async updatePortfolio(
    id: string,
    userId: string,
    dto: UpdatePortfolioDto,
  ): Promise<UserPortfolio> {
    return this.profileRepo.updatePortfolio(id, userId, dto);
  }

  async deletePortfolio(id: string, userId: string): Promise<void> {
    return this.profileRepo.deletePortfolio(id, userId);
  }

  async upsertRateSettings(
    userId: string,
    dto: UpsertRateSettingsDto,
  ): Promise<UserRateSettings> {
    return this.profileRepo.upsertRateSettings(userId, dto);
  }

  async addLicense(userId: string, dto: AddLicenseDto): Promise<UserLicense> {
    return this.profileRepo.addLicense(userId, dto);
  }

  async updateLicense(
    id: string,
    userId: string,
    dto: UpdateLicenseDto,
  ): Promise<UserLicense> {
    return this.profileRepo.updateLicense(id, userId, dto);
  }

  async deleteLicense(id: string, userId: string): Promise<void> {
    return this.profileRepo.deleteLicense(id, userId);
  }

  async addSpecialization(
    userId: string,
    dto: AddSpecializationDto,
  ): Promise<UserSpecialization> {
    return this.profileRepo.addSpecialization(userId, dto);
  }

  async updateSpecialization(
    id: string,
    userId: string,
    dto: UpdateSpecializationDto,
  ): Promise<UserSpecialization> {
    return this.profileRepo.updateSpecialization(id, userId, dto);
  }

  async deleteSpecialization(id: string, userId: string): Promise<void> {
    return this.profileRepo.deleteSpecialization(id, userId);
  }

  async addIdentityDocument(
    userId: string,
    dto: AddIdentityDocumentDto,
  ): Promise<UserIdentityDocument> {
    return this.profileRepo.addIdentityDocument(userId, dto);
  }

  async deleteIdentityDocument(id: string, userId: string): Promise<void> {
    return this.profileRepo.deleteIdentityDocument(id, userId);
  }
}
