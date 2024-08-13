import React, { PropsWithChildren } from 'react';

export function ProcessButtonsContainer({ children }: PropsWithChildren) {
  return (
    <div className="app-sdk-w-full app-sdk-absolute app-sdk-top-0 app-sdk-left-0 app-sdk-z-40 app-sdk-pt-2 app-sdk-pointer-events-none">
      <div className="app-sdk-flex app-sdk-w-fit app-sdk-mx-auto app-sdk-rounded-full app-sdk-px-3 app-sdk-py-2 app-sdk-gap-1 app-sdk-border app-sdk-border-solid app-sdk-bg-white/95 dark:app-sdk-bg-black/85 dark:app-sdk-border-none app-sdk-pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
