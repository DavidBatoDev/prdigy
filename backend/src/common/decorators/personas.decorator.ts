import { SetMetadata } from '@nestjs/common';

export type PersonaType = 'client' | 'freelancer' | 'consultant' | 'admin';

export const PERSONAS_KEY = 'personas';

export const Personas = (...personas: PersonaType[]) =>
  SetMetadata(PERSONAS_KEY, personas);
