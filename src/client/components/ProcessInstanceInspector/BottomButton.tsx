import React, { PropsWithChildren } from 'react';

export function BottomButton({
  children,
  className,
  onClick,
}: PropsWithChildren<{ className?: string; onClick?: () => void }>) {
  return (
    <div
      className={`app-sdk-flex app-sdk-w-6 app-sdk-h-4 app-sdk-text-white app-sdk-bg-slate-500 app-sdk-rounded app-sdk-text-xs app-sdk-items-center app-sdk-justify-center ${className ?? ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
