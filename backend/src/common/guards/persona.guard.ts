import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { PERSONAS_KEY, PersonaType } from '../decorators/personas.decorator';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class PersonaGuard implements CanActivate {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabaseAdmin: SupabaseClient,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPersonas = this.reflector.getAllAndOverride<PersonaType[]>(
      PERSONAS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPersonas || requiredPersonas.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const { data: profile, error } = await this.supabaseAdmin
      .from('profiles')
      .select('active_persona')
      .eq('id', request.user.id)
      .single();

    if (error || !profile) {
      throw new ForbiddenException('Profile not found');
    }

    const activePersona = profile.active_persona as PersonaType;

    if (!requiredPersonas.includes(activePersona)) {
      throw new ForbiddenException(
        `This action requires one of these personas: ${requiredPersonas.join(', ')}`,
      );
    }

    return true;
  }
}
