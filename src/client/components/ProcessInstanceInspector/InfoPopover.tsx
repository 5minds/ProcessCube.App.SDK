import React, { PropsWithChildren } from 'react';

import { classNames } from '../../utils/classNames';

export function InfoPopover({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={classNames(
        className,
        'app-sdk-w-1/4 app-sdk-min-w-64 app-sdk-absolute app-sdk-top-0 app-sdk-right-0 app-sdk-z-50 app-sdk-pt-2 app-sdk-pr-2 app-sdk-transition-all app-sdk-duration-200',
      )}
    >
      <div className="app-sdk-flex app-sdk-flex-col app-sdk-h-full app-sdk-rounded-3xl app-sdk-p-2 app-sdk-gap-1 app-sdk-bg-black/85">
        {children}
      </div>
    </div>
  );
}
