import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Navigates to an URL.
 * @param url The URL to navigate to.
 * @returns Promise<never>
 */
export async function navigateToUrl(url: string): Promise<never> {
  revalidatePath(url);
  redirect(url);
}
