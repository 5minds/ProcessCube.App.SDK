import React, { PropsWithChildren } from 'react';

import { classNames } from '../../utils/classNames';

type BottomButtonProps = {
  title?: string;
  className?: string;
  onClick?: () => void;
};

export function BottomButton({ title, children, className, onClick }: PropsWithChildren<BottomButtonProps>) {
  return (
    <button
      title={title}
      className={classNames(
        className,
        'app-sdk-appearance-none app-sdk-border-none app-sdk-pointer-events-auto app-sdk-cursor-pointer app-sdk-flex app-sdk-w-6 app-sdk-min-w-6 app-sdk-max-w-6 app-sdk-h-4 app-sdk-text-white app-sdk-bg-cyan-800 app-sdk-rounded app-sdk-text-xs app-sdk-items-center app-sdk-justify-center',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
