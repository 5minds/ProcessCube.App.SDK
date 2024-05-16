import React, { PropsWithChildren } from 'react';

type BottomButtonContainer = {
  width: number;
};

export function BottomButtonContainer({ width, children }: PropsWithChildren<BottomButtonContainer>) {
  return (
    <div className={`app-sdk-flex app-sdk-gap-1 app-sdk-justify-center`} style={{ width: `${width}px` }}>
      {children}
    </div>
  );
}
