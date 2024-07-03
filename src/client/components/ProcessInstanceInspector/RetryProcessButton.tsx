import React from 'react';

export function RetryProcessButton({ processInstanceId, refresh }: { processInstanceId: string; refresh: () => void }) {
  return (
    <div
      title="Retry Process"
      className="app-sdk-flex app-sdk-h-full app-sdk-items-center app-sdk-rounded-lg app-sdk-p-2 app-sdk-cursor-pointer hover:app-sdk-bg-app-sdk-gray-200/30"
      onClick={() =>
        import('../../../server/actions').then(({ retryProcess }) => retryProcess(processInstanceId).then(refresh))
      }
    >
      <svg
        className="!app-sdk-stroke-[color:var(--asdk-bv-foreground-color)] !app-sdk-fill-[color:var(--asdk-bv-foreground-color)]"
        width="2rem"
        height="2rem"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z" />
      </svg>
    </div>
  );
}
