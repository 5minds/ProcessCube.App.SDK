import { revalidatePath } from 'next/cache';
import { RedirectType } from 'next/dist/client/components/redirect';
import { redirect } from 'next/navigation';

/**
 * Navigates to an URL. This uses next's {@link redirect} function. As this is an server action, the {@link RedirectType} is 'push' only.
 * @param url The URL to navigate to.
 * @returns Promise<never>
 */
export async function navigateToUrl(url: string): Promise<never> {
  revalidatePath(url);
  redirect(url);
}
