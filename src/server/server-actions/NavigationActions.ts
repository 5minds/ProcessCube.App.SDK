import { RedirectType, redirect } from 'next/navigation';

/**
 * Navigates to an URL. This uses next's {@link redirect} function. As this is an server action, the {@link RedirectType} is 'push' only.
 * @param url The URL to navigate to.
 * @returns never
 */
export function navigateToUrl(url: string): never {
  redirect(url);
}
