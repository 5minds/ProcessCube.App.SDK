import { cookies, headers } from 'next/headers';
import { getToken } from 'next-auth/jwt';

import type { DataModels } from '@5minds/processcube_engine_client';

/**
 *
 * @returns The users {@link DataModels.Iam.Identity} which can be used to access the 5Minds Engine.
 */
export async function getIdentity(): Promise<DataModels.Iam.Identity> {
  const token = await getToken({
    req: { cookies: cookies(), headers: headers() },
  } as any);

  if (!token?.accessToken || !token?.sub) {
    throw new Error('AccessToken or Sub could not be determined!');
  }

  return {
    token: token?.accessToken,
    userId: token?.sub,
  };
}
