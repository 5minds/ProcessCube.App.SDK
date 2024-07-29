import React from 'react';

import { ProcessButton } from './ProcessButton';

type TerminateProcessButtonProps = {
  processInstanceId: string;
  disabled: boolean;
  refresh: () => void;
};

export function TerminateProcessButton({ processInstanceId, disabled, refresh }: TerminateProcessButtonProps) {
  return (
    <ProcessButton
      title="Terminate Process"
      disabled={disabled}
      onClick={() =>
        import('../../../server/actions').then(({ terminateProcess }) =>
          terminateProcess(processInstanceId).then(refresh),
        )
      }
    >
      <svg
        className={
          disabled
            ? '!app-sdk-stroke-app-sdk-gray-400 !app-sdk-fill-app-sdk-gray-400'
            : '!app-sdk-stroke-red-600 !app-sdk-fill-red-600'
        }
        width="1.25rem"
        height="1.25rem"
        viewBox="0 0 516 516"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm192-96l128 0c17.7 0 32 14.3 32 32l0 128c0 17.7-14.3 32-32 32l-128 0c-17.7 0-32-14.3-32-32l0-128c0-17.7 14.3-32 32-32z" />
      </svg>
    </ProcessButton>
  );
}
