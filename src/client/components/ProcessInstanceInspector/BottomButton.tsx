import React, { PropsWithChildren } from 'react';

type BottomButtonProps = {
  title?: string;
  className?: string;
  onClick?: () => void;
};

export function BottomButton({ title, children, className, onClick }: PropsWithChildren<BottomButtonProps>) {
  return (
    <div
      title={title}
      className={`app-sdk-flex app-sdk-w-6 app-sdk-min-w-6 app-sdk-max-w-6 app-sdk-h-4 app-sdk-text-white app-sdk-bg-slate-500 app-sdk-rounded app-sdk-text-xs app-sdk-items-center app-sdk-justify-center ${
        className ?? ''
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
