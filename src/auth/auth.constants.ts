export const AUTH_ERRORS = {
  SCHOOL_NOT_FOUND: 'School not found',
  COACH_ALREADY_ASSIGNED: (schoolName: string) =>
    `A coach is already assigned to the school "${schoolName}"`,
  COACH_NOT_FOUND: 'Coach not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_VERIFICATION_FAILED: 'Email verification failed',
  EMAIL_NOT_VERIFIED: 'Email is not verified',
  ACCESS_DENIDED: 'Access denied',
};

export const AUTH_SUCCESS = {
  EMAIL_VERIFIED: 'Email verified successfully',
  REGISTRATION_SUCCESS: 'Registration successful. Please verify your email.',
  LOGIN_SUCCESS: 'Login successful',
};
