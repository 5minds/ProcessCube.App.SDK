export * from './build/common/index';

import { DefaultSession, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

/**
 * Module augmentations for next-auth
 * These extend the default session and JWT types to include claims from the SDK
 */
declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's identity claims. */
      claims?: Record<string, unknown>;
    } & DefaultSession['user'] & {
      [profile_property: string]: any;
    };
    error?: 'RefreshAccessTokenError';
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID Access Token */
    accessToken?: string;
    /** OpenID ID Token */
    idToken?: string;
    /** OpenID Refresh Token */
    refreshToken?: string;
    expiresAt: number;
    error?: 'RefreshAccessTokenError';
    user?: User;
  }
}
