import { Logger } from '@5minds/processcube_engine_sdk';

import { ServerAccessTokenOptions, getServerAccessToken } from './getServerIdentity';

const logger = new Logger('processcube_app_sdk:authority_client');

export interface AuthorityClientOptions extends ServerAccessTokenOptions {
  /**
   * Base URL of the Authority. Defaults to `process.env.PROCESSCUBE_AUTHORITY_URL`.
   */
  authorityUrl?: string;
}

export interface AuthorityResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * Client for the ProcessCube Authority API.
 *
 * **Stufe 1 — Allgemein:** Use {@link request} for arbitrary Authority API calls.
 * The client handles authentication (access token in cookie) automatically.
 *
 * **Stufe 2 — ProcessCube-spezifisch:** Convenience methods for common user admin operations:
 * {@link updateClaim}, {@link addScope}, {@link addGroup}, {@link deleteUser}.
 */
export class AuthorityClient {
  private readonly authorityUrl: string;
  private readonly tokenOptions: ServerAccessTokenOptions;

  constructor(options?: AuthorityClientOptions) {
    const url = options?.authorityUrl ?? process.env.PROCESSCUBE_AUTHORITY_URL;
    if (!url) {
      throw new Error('PROCESSCUBE_AUTHORITY_URL is not configured. Set the environment variable or pass authorityUrl.');
    }
    this.authorityUrl = url.replace(/\/+$/, '');
    this.tokenOptions = options ?? {};
  }

  // ---------------------------------------------------------------------------
  // Stufe 1 — Allgemeine Methode
  // ---------------------------------------------------------------------------

  /**
   * Sends an authenticated request to the Authority API.
   *
   * The access token is automatically fetched (and cached) via {@link getServerAccessToken}.
   * It is sent as a cookie (`access_token=...`).
   *
   * @param method HTTP method (GET, POST, PATCH, PUT, DELETE)
   * @param path   Path relative to the authority URL (e.g. `/acr/username_password/admin/user/...`)
   * @param body   Optional request body (will be JSON-serialized)
   * @returns Typed {@link AuthorityResponse} with status, ok flag, and parsed JSON data.
   */
  async request<T = unknown>(method: string, path: string, body?: unknown): Promise<AuthorityResponse<T>> {
    const accessToken = await getServerAccessToken(this.tokenOptions);
    const url = `${this.authorityUrl}${path}`;

    logger.info(`Authority request: ${method} ${path}`);

    const headers: Record<string, string> = {
      Cookie: `access_token=${accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      redirect: 'follow',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data: T;
    try {
      data = await response.json();
    } catch {
      data = undefined as T;
    }

    if (!response.ok) {
      logger.error(`Authority request failed: ${method} ${path} → ${response.status} ${response.statusText}`);
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }

  // ---------------------------------------------------------------------------
  // Stufe 2 — ProcessCube Authority Convenience-Methoden
  // ---------------------------------------------------------------------------

  private userAdminPath(username: string, action: string): string {
    return `/acr/username_password/admin/user/${encodeURIComponent(username)}/${action}`;
  }

  /**
   * Updates a claim on a user account.
   *
   * @param username The username (typically the email address)
   * @param claimName  Name of the claim to set
   * @param claimValue Value of the claim
   */
  async updateClaim(username: string, claimName: string, claimValue: unknown): Promise<AuthorityResponse> {
    return this.request('PATCH', this.userAdminPath(username, 'update/claim'), { claimName, claimValue });
  }

  /**
   * Adds a scope to a user account.
   *
   * @param username  The username (typically the email address)
   * @param scopeName Name of the scope to add
   */
  async addScope(username: string, scopeName: string): Promise<AuthorityResponse> {
    return this.request('PATCH', this.userAdminPath(username, 'add/scope'), { scopeName });
  }

  /**
   * Adds a user to a group.
   *
   * @param username  The username (typically the email address)
   * @param groupName Name of the group to add the user to
   */
  async addGroup(username: string, groupName: string): Promise<AuthorityResponse> {
    return this.request('PATCH', this.userAdminPath(username, 'add/group'), { groupName });
  }

  /**
   * Deletes (or soft-deletes) a user account.
   *
   * @param username The username (typically the email address)
   * @param options  Delete options. `fullDelete: false` (default) performs a soft delete.
   */
  async deleteUser(username: string, options?: { fullDelete?: boolean }): Promise<AuthorityResponse<{ username?: string }>> {
    return this.request('DELETE', this.userAdminPath(username, 'delete'), {
      fullDelete: options?.fullDelete ?? false,
    });
  }
}
