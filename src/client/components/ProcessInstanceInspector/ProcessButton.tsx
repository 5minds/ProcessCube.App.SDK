import React, { PropsWithChildren } from 'react';

import { classNames } from '../../utils/classNames';

export type ProcessButtonProps = {
  title?: string;
  disabled?: boolean;
  onClick: () => void;
};

export function ProcessButton({ title, disabled, children, onClick }: PropsWithChildren<ProcessButtonProps>) {
  return (
    <button
      title={`${title ?? ''}${disabled ? ' (disabled)' : ''}`}
      className={classNames(
        'app-sdk-appearance-none app-sdk-border-none app-sdk-bg-transparent app-sdk-flex app-sdk-h-full app-sdk-items-center app-sdk-rounded-full app-sdk-p-2',
        disabled ? 'app-sdk-cursor-not-allowed' : 'app-sdk-cursor-pointer hover:app-sdk-bg-app-sdk-gray-100/40',
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
