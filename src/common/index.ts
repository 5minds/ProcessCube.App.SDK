import NextAuth, { DefaultSession, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';

export * from './components/RemoteUserTask';
export * from './functions/hasClaim';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXTAUTH_CLIENT_ID?: string;
      PROCESSCUBE_AUTHORITY_URL?: string;
    }
  }
}

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's identity claims. */
      claims?: Record<string, unknown>;
    } & DefaultSession['user'] & { [profile_property: string]: any };
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
