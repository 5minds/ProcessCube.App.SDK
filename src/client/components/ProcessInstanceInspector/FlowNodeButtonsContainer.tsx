import React, { PropsWithChildren } from 'react';

type FlowNodeButtonsContainerProps = {
  width: number;
};

export function FlowNodeButtonsContainer({ width, children }: PropsWithChildren<FlowNodeButtonsContainerProps>) {
  return (
    <div className="app-sdk-flex app-sdk-gap-1 app-sdk-justify-center app-sdk-flex-wrap" style={{ width: `${width}px` }}>
      {children}
    </div>
  );
}
