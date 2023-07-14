import { Session, getServerSession, CallbacksOptions } from 'next-auth';
import { getSession } from 'next-auth/react';
import type { JWT } from 'next-auth/jwt';

import jwtDecode from 'jwt-decode';

export async function hasClaim(claim: string): Promise<boolean> {
  let user: Session['user'] | undefined;
  if (typeof window === 'undefined') {
    user = (
      await getServerSession({
        callbacks: {
          jwt: authConfigJwtCallback,
          session: authConfigSessionCallback,
        },
      })
    )?.user;
  } else {
    user = (await getSession())?.user;
  }

  if (!user || !user.claims) {
    return false;
  }

  return user.claims[claim] != undefined;
}

export async function authConfigJwtCallback(args: Parameters<CallbacksOptions['jwt']>[0]): Promise<JWT> {
  const { token, account } = args;

  if (account) {
    token.accessToken = account.access_token;
    token.idToken = account.id_token;
  }
  return token;
}

export async function authConfigSessionCallback(args: Parameters<CallbacksOptions['session']>[0]): Promise<Session> {
  const { session, token } = args;
  const accessToken = await decodeJwt(token.accessToken!);
  const idToken = await decodeJwt(token.idToken!);

  const idTokenKeys = Object.keys(idToken);
  const claims = Object.fromEntries(Object.entries(accessToken).filter(([key, value]) => !idTokenKeys.includes(key)));

  delete claims.scope;
  delete claims.jti;
  delete claims.client_id;

  session.user.claims = claims;

  return session;
}

async function decodeJwt(token: string) {
  return jwtDecode<Record<string, unknown>>(token);
}
