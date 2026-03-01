import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../../config/supabase.module';
import { AdminRepository } from './admin.repository.interface';

@Injectable()
export class SupabaseAdminRepository implements AdminRepository {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
  ) {}

  async getAdminProfile(userId: string) {
    const { data } = await this.supabase
      .from('admin_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    return data;
  }

  async listApplications(filters: { status?: string }) {
    let q = this.supabase
      .from('consultant_applications')
      .select('*, user:profiles(id, display_name, avatar_url, email, headline)')
      .order('created_at', { ascending: false });
    if (filters.status) q = q.eq('status', filters.status);
    const { data } = await q;
    return data || [];
  }

  async getApplicationDetail(id: string) {
    const { data: app } = await this.supabase
      .from('consultant_applications')
      .select('*')
      .eq('id', id)
      .single();
    if (!app) throw new NotFoundException('Application not found');

    const userId = (app as Record<string, string>).user_id;

    const [
      profile,
      skills,
      languages,
      educations,
      certifications,
      licenses,
      experiences,
      portfolios,
      specializations,
      identityDocs,
    ] = await Promise.all([
      this.supabase.from('profiles').select('*').eq('id', userId).single(),
      this.supabase
        .from('user_skills')
        .select('*, skill:skills(*)')
        .eq('user_id', userId),
      this.supabase
        .from('user_languages')
        .select('*, language:languages(*)')
        .eq('user_id', userId),
      this.supabase.from('user_educations').select('*').eq('user_id', userId),
      this.supabase
        .from('user_certifications')
        .select('*')
        .eq('user_id', userId),
      this.supabase.from('user_licenses').select('*').eq('user_id', userId),
      this.supabase.from('user_experiences').select('*').eq('user_id', userId),
      this.supabase.from('user_portfolios').select('*').eq('user_id', userId),
      this.supabase
        .from('user_specializations')
        .select('*')
        .eq('user_id', userId),
      this.supabase
        .from('user_identity_documents')
        .select('*')
        .eq('user_id', userId),
    ]);

    return {
      application: app,
      profile: profile.data,
      skills: skills.data || [],
      languages: languages.data || [],
      educations: educations.data || [],
      certifications: certifications.data || [],
      licenses: licenses.data || [],
      experiences: experiences.data || [],
      portfolios: portfolios.data || [],
      specializations: specializations.data || [],
      identity_documents: identityDocs.data || [],
    };
  }

  async approveApplication(id: string) {
    const { data: app } = await this.supabase
      .from('consultant_applications')
      .select('user_id')
      .eq('id', id)
      .single();
    if (!app) throw new NotFoundException('Application not found');

    await this.supabase
      .from('profiles')
      .update({ is_consultant_verified: true })
      .eq('id', (app as Record<string, string>).user_id);

    const { data, error } = await this.supabase
      .from('consultant_applications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async rejectApplication(id: string, reason?: string) {
    const { data, error } = await this.supabase
      .from('consultant_applications')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async listAdmins() {
    const { data } = await this.supabase
      .from('admin_profiles')
      .select('*, user:profiles(id, display_name, avatar_url, email)')
      .eq('is_active', true);
    return data || [];
  }

  async grantAdmin(
    userId: string,
    data: { access_level?: string; department?: string },
  ) {
    const { data: row, error } = await this.supabase
      .from('admin_profiles')
      .upsert(
        { user_id: userId, is_active: true, ...data },
        { onConflict: 'user_id' },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  }

  async revokeAdmin(userId: string): Promise<void> {
    await this.supabase
      .from('admin_profiles')
      .update({ is_active: false })
      .eq('user_id', userId);
  }

  async getMatchCandidates(projectId: string): Promise<unknown[]> {
    // Get project skills for scoring
    const { data: project } = await this.supabase
      .from('projects')
      .select('skills')
      .eq('id', projectId)
      .single();

    const projectSkills: string[] = Array.isArray(
      (project as Record<string, unknown>)?.skills,
    )
      ? ((project as Record<string, unknown[]>).skills as string[])
      : [];

    const { data: candidates } = await this.supabase
      .from('profiles')
      .select(
        `
        id, display_name, avatar_url, headline, country,
        is_consultant_verified,
        rate_settings:user_rate_settings(*),
        stats:user_stats(*),
        specializations:user_specializations(*),
        skills:user_skills(*, skill:skills(*))
      `,
      )
      .eq('is_consultant_verified', true);

    if (!candidates) return [];

    // Score candidates by skill overlap
    return (candidates as Record<string, unknown>[])
      .map((c) => {
        const candidateSkillNames: string[] = Array.isArray(c.skills)
          ? (c.skills as Record<string, unknown>[]).map((s) => {
              const skill = s.skill as Record<string, string> | undefined;
              return skill?.name?.toLowerCase() ?? '';
            })
          : [];

        const overlap = projectSkills.filter((ps) =>
          candidateSkillNames.includes(String(ps).toLowerCase()),
        ).length;

        return { ...c, _matchScore: overlap };
      })
      .sort((a, b) => (b._matchScore as number) - (a._matchScore as number));
  }

  async assignConsultant(projectId: string, consultantId: string) {
    const { data, error } = await this.supabase
      .from('projects')
      .update({ consultant_id: consultantId, status: 'active' })
      .eq('id', projectId)
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Project not found');
    return data;
  }

  async listProjects() {
    const { data } = await this.supabase
      .from('projects')
      .select(
        '*, client:profiles!projects_client_id_fkey(id, display_name, avatar_url), consultant:profiles!projects_consultant_id_fkey(id, display_name, avatar_url)',
      )
      .order('created_at', { ascending: false });
    return data || [];
  }

  async listUsers() {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    return data || [];
  }
}
