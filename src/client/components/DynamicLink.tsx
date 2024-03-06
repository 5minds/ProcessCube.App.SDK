import { useRouter } from 'next/navigation';
import React from 'react';

type DynamicLinkProps = {
  href: string;
  children: any;
};

// Workaround für https://github.com/vercel/next.js/issues/42991#issuecomment-1592921378
export function DynamicLink({ href, children }: DynamicLinkProps) {
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
