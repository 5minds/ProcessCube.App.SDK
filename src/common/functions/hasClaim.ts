import jwtDecode from 'jwt-decode';
import { getServerSession } from 'next-auth';

async function hasClaim(claim: string): Promise<boolean> {
  const user = (await getServerSession())?.user as any;

  if (!user || !user.access_token || user.access_token === '') {
    return false;
  }

  const decodedAccessToken = jwtDecode<Record<string, unknown>>(user.access_token);

  if (!decodedAccessToken) {
    return false;
  }

  return decodedAccessToken[claim] != undefined;
}
