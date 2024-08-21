import { getToken } from 'next-auth/jwt';
import { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies, headers } from 'next/headers';

import type { DataModels } from '@5minds/processcube_engine_sdk';

/**
 *
 * @returns The users {@link DataModels.Iam.Identity} which can be used to access the 5Minds Engine.
 */
export async function getIdentity(): Promise<DataModels.Iam.Identity> {
  let token = await getToken({
    req: { cookies: cookies(), headers: headers() } as any,
  });

  const tokenIsExpired = token?.expiresAt && Date.now() >= token.expiresAt * 1000;
  if (tokenIsExpired) {
    /**
     * This call triggers the jwt callback function to refresh the access token and
     * responds with a `Set-Cookie` Header that holds the new encrypted cookie, which contains the new access token.
     *
     * The jwt callback function (`authConfigJwtCallback`) is configured by the AuthOptions at the NextAuth Route Handler.
     */
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookies().toString(),
      },
    });

    const responseCookies = new ResponseCookies(response.headers);

    if (responseCookies.getAll().length) {
      let errorOnSetCookies = false;
      // update the server cookie with the new session and refreshed access token
      try {
        for (const cookie of responseCookies.getAll()) {
          cookies().set(cookie.name, cookie.value, {
            ...cookie,
          });
        }
      } catch {
        // Cookies can only be modified in a Server Action or Route Handler, not in a React Server Component
        // so in this case we use the responseCookie to get the refreshed token
        errorOnSetCookies = true;
      }

      token = await getToken({
        req: { cookies: errorOnSetCookies ? responseCookies : cookies(), headers: headers() },
      } as any);

      if (token?.error) throw token.error;
    }
  }

  if (!token?.accessToken || !token?.sub) {
    throw new Error('AccessToken or Sub could not be determined!');
  }

  return {
    token: token?.accessToken,
    userId: token?.sub,
  };
}
