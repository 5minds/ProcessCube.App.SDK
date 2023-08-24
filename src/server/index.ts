import 'only-server';

export * from './lib';
export * from './server-actions';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PROCESSCUBE_ENGINE_URL?: string;
      PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_ID?: string;
      PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_SECRET?: string;
      PROCESSCUBE_AUTHORITY_URL?: string;
    }
  }
}

import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's identity claims. */
      claims?: Record<string, unknown>;
    } & DefaultSession['user'];
  }
}

import { JWT } from 'next-auth/jwt';

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID Access Token */
    accessToken?: string;
    /** OpenID ID Token */
    idToken?: string;
  }
}
