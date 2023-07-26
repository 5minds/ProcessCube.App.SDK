import { Session, getServerSession, CallbacksOptions, Account, TokenSet } from 'next-auth';
import { getSession } from 'next-auth/react';
import type { JWT } from 'next-auth/jwt';

import jwtDecode from 'jwt-decode';

/**
 *
 * @returns {Boolean} A boolean whether the user has the claim or not
 */
export async function hasClaim(claim: string): Promise<boolean> {
  let user: Session['user'] | undefined;
  const isCalledInServerComponent = typeof window === 'undefined';

  if (isCalledInServerComponent) {
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

/**
 *
 * This function passes the {@link Account}'s {@link Account.access_token} and {@link Account.id_token} to the generated {@link JWT}.
 *
 * @param args The arguments of {@link CallbacksOptions.jwt}.
 * @returns A {@link JWT}
 */
export async function authConfigJwtCallback(args: Parameters<CallbacksOptions['jwt']>[0]): Promise<JWT> {
  const { token, account } = args;

  if (account) {
    console.log('acc', account);
    token.accessToken = account.access_token;
    token.idToken = account.id_token;
    token.refreshToken = account.refresh_token;
    token.expiresAt = account.expires_at ?? Math.floor(Date.now() / 1000 + (account.expires_in as number));
    console.log('account.expires_at', account.expires_at);
    console.log('account.expires_in', account.expires_in);
    console.log('account.refresh_token', account.refresh_token);
  }

  if (Date.now() >= token.expiresAt * 1000) {
    console.log('token is expired');
    try {
      const response = await fetch(`${process.env.PROCESSCUBE_AUTHORITY_URL}/token`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.NEXTAUTH_CLIENT_ID!,
          client_secret: process.env.NEXTAUTH_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken!,
        }),
        method: 'POST',
      });

      const tokens: TokenSet = await response.json();
      console.log('new tokens from fetch', tokens);
      if (!response.ok) throw tokens;

      token.accessToken = tokens.access_token;
      token.idToken = tokens.id_token;
      token.expiresAt = Math.floor(Date.now() / 1000 + (tokens.expires_in as number));
      token.refreshToken = tokens.refresh_token ?? token.refreshToken;

      console.log('new access_token', tokens.access_token);
      console.log('new refresh_token', tokens.refresh_token);
      console.log('new expires_at', token.expiresAt);
    } catch (error) {
      console.error('Error refreshing access token', error);

      token.error = 'RefreshAccessTokenError';
    }
  }

  console.log('token to return ', token);
  return token;
}

/**
 *
 * This function passes the {@link Account.access_token} Claims to the current {@link Session} user.
 *
 * @param args The arguments of {@link CallbacksOptions.session}.
 * @returns A {@link JWT}
 */
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
  session.error = token.error;

  return session;
}

async function decodeJwt(token: string) {
  return jwtDecode<Record<string, unknown>>(token);
}
