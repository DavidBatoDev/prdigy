import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabaseAdmin: SupabaseClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException();
    }

    const { data: adminProfile, error } = await this.supabaseAdmin
      .from('admin_profiles')
      .select('user_id, access_level, is_active')
      .eq('user_id', request.user.id)
      .eq('is_active', true)
      .single();

    if (error || !adminProfile) {
      throw new ForbiddenException('Admin access required');
    }

    // Attach admin profile to request for downstream use
    (
      request as AuthenticatedRequest & { adminProfile: typeof adminProfile }
    ).adminProfile = adminProfile;

    return true;
  }
}
