import { Request } from "express";

export interface RegisterDto {
  email: string;
  username: string;
  fullname: string;
  phoneNumber: string;
  password?: string;
  // NOTE: residentId/userId from the frontend is never trusted for
  // resident matching. The backend verifies Full Name + Email + Phone.
  residentId?: unknown;
  userId?: unknown;
}

export interface LoginDto {
  username: string;
  password?: string;
}

export interface TokenPayload {
  id: number;
  username: string;
  email: string;
  fullname?: string | null;
  role: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  fullname?: string | null;
  phoneNumber?: string | null;
  isVerified: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}
