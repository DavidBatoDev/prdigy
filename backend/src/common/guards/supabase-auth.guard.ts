import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SUPABASE_ADMIN, SUPABASE_CLIENT } from '../../config/supabase.module';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../interfaces/authenticated-request.interface';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabaseClient: SupabaseClient,
    @Inject(SUPABASE_ADMIN) private readonly supabaseAdmin: SupabaseClient,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers['authorization'];

    // --- JWT auth ---
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data, error } = await this.supabaseClient.auth.getUser(token);

      if (error || !data.user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      request.user = {
        id: data.user.id,
        email: data.user.email,
      };

      return true;
    }

    // --- Guest auth ---
    const guestSessionId = request.headers['x-guest-user-id'] as string;

    if (guestSessionId) {
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data: profile, error } = await this.supabaseAdmin
        .from('profiles')
        .select('id, guest_session_id')
        .eq('guest_session_id', guestSessionId)
        .eq('is_guest', true)
        .gt('created_at', thirtyDaysAgo)
        .single();

      if (error || !profile) {
        throw new UnauthorizedException('Invalid or expired guest session');
      }

      request.user = {
        id: profile.id as string,
        is_guest: true,
        guest_session_id: guestSessionId,
      } as AuthenticatedUser;

      return true;
    }

    throw new UnauthorizedException('No valid authentication provided');
  }
}
