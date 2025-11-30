import type jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
}
