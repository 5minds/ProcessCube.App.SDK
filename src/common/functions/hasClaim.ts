import { Session, getServerSession, CallbacksOptions, Account, TokenSet } from 'next-auth';
import { getSession } from 'next-auth/react';
import type { JWT } from 'next-auth/jwt';
import { jwtDecode } from 'jwt-decode';

import { Logger } from '@5minds/processcube_engine_sdk';

const logger = new Logger('processcube_app_sdk:next-auth_configuration');
const MISSING_REFRESH_TOKEN_MESSAGE =
  'No refresh token present. Your authority might be configured incorrectly. For more information see https://processcube.io/docs/app-sdk/samples/authority/authentication-with-nextauth';

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
  const { token, account, user } = args;

  if (account) {
    token.accessToken = account.access_token;
    token.idToken = account.id_token;
    token.refreshToken = account.refresh_token;
    token.expiresAt = account.expires_at ?? Math.floor(Date.now() / 1000 + (account.expires_in as number));
  }

  if (user) {
    token.user = user;
  }

  const necessaryEnvsGiven =
    process.env.PROCESSCUBE_AUTHORITY_URL != null &&
    process.env.NEXTAUTH_CLIENT_ID != null &&
    process.env.NEXTAUTH_SECRET != null;

  if (!necessaryEnvsGiven) {
    logger.warn(
      'In order for the Access Token to be automatically renewed, PROCESSCUBE_AUTHORITY_URL, NEXTAUTH_CLIENT_ID and NEXTAUTH_SECRET must be set as an environment variable',
    );
  }

  if (token.refreshToken === undefined) {
    logger.warn(MISSING_REFRESH_TOKEN_MESSAGE);
  }

  if (necessaryEnvsGiven && Date.now() >= token.expiresAt * 1000) {
    if (token.refreshToken === undefined) {
      logger.error('Error refreshing access token.', { err: MISSING_REFRESH_TOKEN_MESSAGE });
      token.error = 'RefreshAccessTokenError';

      return token;
    }
    try {
      const response = await fetch(`${process.env.PROCESSCUBE_AUTHORITY_URL}/token`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.NEXTAUTH_CLIENT_ID as string,
          client_secret: process.env.NEXTAUTH_SECRET as string,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken!,
        }),
        method: 'POST',
      });

      const tokens: TokenSet = await response.json();
      if (!response.ok) throw tokens;

      token.accessToken = tokens.access_token;
      token.idToken = tokens.id_token;
      token.expiresAt = Math.floor(Date.now() / 1000 + (tokens.expires_in as number));
      token.refreshToken = tokens.refresh_token ?? token.refreshToken;
    } catch (error) {
      logger.error('Error refreshing access token', { err: error });

      token.error = 'RefreshAccessTokenError';
    }
  }

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
  const accessToken = decodeJwt(token.accessToken!);
  const idToken = decodeJwt(token.idToken!);

  const idTokenKeys = Object.keys(idToken);
  const claims = Object.fromEntries(Object.entries(accessToken).filter(([key, value]) => !idTokenKeys.includes(key)));

  delete claims.scope;
  delete claims.jti;
  delete claims.client_id;

  session.user = token.user ?? {};
  session.user.claims = claims;
  session.error = token.error;

  return session;
}

function decodeJwt(token: string) {
  return jwtDecode<Record<string, unknown>>(token);
}
