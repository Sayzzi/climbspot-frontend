import { AuthFailure, type AuthFailureReason } from '@/shared/auth';

/** What went wrong with a code, in the Visitor's terms. */
export const codeProblemOf = (error: unknown): AuthFailureReason =>
  error instanceof AuthFailure && error.reason === 'invalid-code' ? 'invalid-code' : 'failed';
