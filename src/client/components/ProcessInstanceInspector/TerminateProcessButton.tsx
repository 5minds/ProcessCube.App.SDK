import React from 'react';

export function TerminateProcessButton({
  processInstanceId,
  refresh,
}: {
  processInstanceId: string;
  refresh: () => void;
}) {
  return (
    <button
      title="Terminate Process"
      className="app-sdk-appearance-none app-sdk-border-none app-sdk-bg-transparent app-sdk-flex app-sdk-h-full app-sdk-items-center app-sdk-rounded-lg app-sdk-p-2 app-sdk-cursor-pointer hover:app-sdk-bg-app-sdk-gray-200/30"
      onClick={() =>
        import('../../../server/actions').then(({ terminateProcess }) =>
          terminateProcess(processInstanceId).then(refresh),
        )
      }
    >
      <svg
        className="!app-sdk-stroke-red-600 !app-sdk-fill-red-600"
        width="2rem"
        height="2rem"
        viewBox="0 0 516 516"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm192-96l128 0c17.7 0 32 14.3 32 32l0 128c0 17.7-14.3 32-32 32l-128 0c-17.7 0-32-14.3-32-32l0-128c0-17.7 14.3-32 32-32z" />
      </svg>
    </button>
  );
}
