import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  is_guest?: boolean;
  guest_session_id?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
