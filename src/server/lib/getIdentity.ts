import { cookies, headers } from 'next/headers';
import { getToken } from 'next-auth/jwt';

import type { DataModels } from '@5minds/processcube_engine_client';
import { getServerSession } from 'next-auth/next';
import { getSession } from 'next-auth/react';
/**
 *
 * @returns The users {@link DataModels.Iam.Identity} which can be used to access the 5Minds Engine.
 */
export async function getIdentity(): Promise<DataModels.Iam.Identity> {
  // schauen ob man selbst nen request machen kann gegen die nextauth routen
  // oder den access token hier dekodieren und erneueern?
  // middleware von nextauth dafür nutzen? => checken ob server actions die middleware triggern
  const session = await getServerSession();
  const secondsession = await getSession({ triggerEvent: true });

  console.log('get server session called', session, secondsession);
  const thirdsession = await getSession({ event: 'timer' });
  const fourth = await getSession({ event: 'storage' });
  const fifth = await getSession({ event: 'hidden' });
  console.log('headers', headers());
  console.log('cookieus', cookies());
  const sixth = await getSession({
    req: {
      headers: headers() as any,
    },
  });

  console.log('thirdsession, fourth, fifth, sixth', thirdsession, fourth, fifth, sixth);
  const token = await getToken({
    req: { cookies: cookies(), headers: headers() },
  } as any);

  console.log('token from getT9oken', token);
  if (!token?.accessToken || !token?.sub) {
    throw new Error('AccessToken or Sub could not be determined!');
  }

  return {
    token: token?.accessToken,
    userId: token?.sub,
  };
}
