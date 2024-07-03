import React, { PropsWithChildren } from 'react';

export function ProcessButtonsContainer({ children }: PropsWithChildren) {
  return (
    <div className="app-sdk-absolute app-sdk-max-w-full app-sdk-h-16 app-sdk-px-4 app-sdk-pt-2 app-sdk-z-10">
      <div className="app-sdk-flex app-sdk-w-fit app-sdk-h-fit app-sdk-border app-sdk-rounded-lg app-sdk-gap-2 app-sdk-items-center app-sdk-bg-app-sdk-gray-200/10">
        {children}
      </div>
    </div>
  );
}
