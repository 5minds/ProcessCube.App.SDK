import { useRouter } from 'next/navigation';

import React from 'react';

import { warnOnceForDeprecation } from '../utils/warnOnceForDeprecation';

type DynamicLinkProps = {
  href: string;
  children: any;
};

/**
 * @deprecated This component should no longer be used.
 * It will be removed in a future version of this package.
 * Please use the NextJS Link component instead.
 *
 * Former workaround for https://github.com/vercel/next.js/issues/42991#issuecomment-1592921378
 */
export function DynamicLink({ href, children }: DynamicLinkProps) {
  warnOnceForDeprecation('DynamicLink', 'Please use the NextJS Link component instead.');
  const router = useRouter();

  return (
    <a
      href={href}
      onClick={(e: { preventDefault: () => void }) => {
        e.preventDefault();
        router.replace(href);
        router.refresh();
      }}
    >
      {children}
    </a>
  );
}
