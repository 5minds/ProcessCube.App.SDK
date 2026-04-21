import { jwtDecode } from 'jwt-decode';

import type { DataModels } from '@5minds/processcube_engine_sdk';
import { Logger } from '@5minds/processcube_engine_sdk';

const logger = new Logger('processcube_app_sdk:server_identity');

const EXPIRY_BUFFER_FACTOR = 0.85;

export interface ServerAccessTokenOptions {
  /**
   * OAuth2 Client ID. Defaults to `process.env.PROCESSCUBE_SERVER_CLIENT_ID`.
   */
  clientId?: string;
  /**
   * OAuth2 Client Secret. Defaults to `process.env.PROCESSCUBE_SERVER_CLIENT_SECRET`.
   */
  clientSecret?: string;
  /**
   * Space-separated OAuth2 scopes. Defaults to `process.env.PROCESSCUBE_SERVER_SCOPES`
   * or `'upe_admin engine_read engine_write'`.
   */
  scopes?: string;
  /**
   * Authority URL. Defaults to `process.env.PROCESSCUBE_AUTHORITY_URL`.
   */
  authorityUrl?: string;
  /**
   * Skip the token cache and always fetch a fresh token.
   */
  skipCache?: boolean;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

const DEFAULT_SCOPES = 'upe_admin engine_read engine_write';

let tokenCache: CachedToken | null = null;

function resolveOptions(options?: ServerAccessTokenOptions) {
  const authorityUrl = options?.authorityUrl ?? process.env.PROCESSCUBE_AUTHORITY_URL;
  const clientId = options?.clientId ?? process.env.PROCESSCUBE_SERVER_CLIENT_ID;
  const clientSecret = options?.clientSecret ?? process.env.PROCESSCUBE_SERVER_CLIENT_SECRET;
  const scopes = options?.scopes ?? process.env.PROCESSCUBE_SERVER_SCOPES ?? DEFAULT_SCOPES;

  if (!authorityUrl) {
    throw new Error('PROCESSCUBE_AUTHORITY_URL is not configured. Set the environment variable or pass authorityUrl.');
  }
  if (!clientId) {
    throw new Error('PROCESSCUBE_SERVER_CLIENT_ID is not configured. Set the environment variable or pass clientId.');
  }
  if (!clientSecret) {
    throw new Error('PROCESSCUBE_SERVER_CLIENT_SECRET is not configured. Set the environment variable or pass clientSecret.');
  }

  return { authorityUrl, clientId, clientSecret, scopes };
}

function isCacheValid(): boolean {
  if (!tokenCache) return false;
  return Date.now() < tokenCache.expiresAt;
}

/**
 * Fetches a server-to-server access token using the OAuth2 Client Credentials flow.
 *
 * Tokens are cached and reused until they expire (with a safety buffer).
 * Throws on authentication errors (e.g. invalid credentials, blocked client).
 *
 * @param options Optional overrides for authority URL, credentials, and scopes.
 * @returns The access token string.
 */
export async function getServerAccessToken(options?: ServerAccessTokenOptions): Promise<string> {
  if (!options?.skipCache && isCacheValid()) {
    return tokenCache!.accessToken;
  }

  const { authorityUrl, clientId, clientSecret, scopes } = resolveOptions(options);

  logger.info('Fetching new server access token');

  const response = await fetch(`${authorityUrl}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow',
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: scopes,
    }).toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const message = `Failed to fetch server access token: ${response.status} ${response.statusText}${errorBody ? ` — ${errorBody}` : ''}`;
    logger.error(message);
    throw new Error(message);
  }

  const body = await response.json();

  if (!body.access_token) {
    throw new Error('Authority response did not contain an access_token');
  }

  const expiresIn = body.expires_in as number | undefined;
  if (expiresIn && expiresIn > 0) {
    tokenCache = {
      accessToken: body.access_token,
      expiresAt: Date.now() + expiresIn * EXPIRY_BUFFER_FACTOR * 1000,
    };
  } else {
    // No expiry info — don't cache
    tokenCache = null;
  }

  logger.info('Server access token fetched successfully');

  return body.access_token;
}

/**
 * Returns a server-to-server {@link DataModels.Iam.Identity} using the Client Credentials flow.
 *
 * Useful in External Tasks or other server-side code that needs to act as a service account
 * rather than an end user.
 *
 * @param options Optional overrides for authority URL, credentials, and scopes.
 * @returns An Identity with `token` and `userId`.
 */
export async function getServerIdentity(options?: ServerAccessTokenOptions): Promise<DataModels.Iam.Identity> {
  const token = await getServerAccessToken(options);
  const decoded = jwtDecode<Record<string, unknown>>(token);

  if (!decoded.sub) {
    throw new Error('Server access token does not contain a "sub" claim');
  }

  return {
    token,
    userId: decoded.sub as string,
  };
}
