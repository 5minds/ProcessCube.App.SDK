import React, { PropsWithChildren } from 'react';

export function ProcessButtonsContainer({ children }: PropsWithChildren) {
  return (
    <div className="app-sdk-w-full app-sdk-absolute app-sdk-top-0 app-sdk-left-0 app-sdk-z-20 app-sdk-pt-2">
      <div className="app-sdk-flex app-sdk-w-fit app-sdk-mx-auto app-sdk-rounded-full app-sdk-p-2 app-sdk-gap-1 app-sdk-bg-black/85">
        {children}
      </div>
    </div>
  );
}
