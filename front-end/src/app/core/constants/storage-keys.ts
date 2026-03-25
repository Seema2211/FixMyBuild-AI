/** localStorage keys — must match what AuthService reads/writes. Change here, fixed everywhere. */
export const STORAGE_KEYS = {
  AccessToken:  'fmb_access_token',
  RefreshToken: 'fmb_refresh_token',
  User:         'fmb_user',
} as const;
