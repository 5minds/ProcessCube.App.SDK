import 'server-only';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { RedirectType } from 'next/dist/client/components/redirect';

export async function hardNavigate(url: string, type?: RedirectType) {
  'use server';
  revalidatePath(url);
  redirect(url, type);
}
