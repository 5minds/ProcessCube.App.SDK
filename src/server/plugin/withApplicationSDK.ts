import type { NextConfig } from 'next';

import { subscribeToExternalTasks } from '../lib';

export interface NextConfigWithApplicationSDKConfig extends NextConfig {
  applicationSDK?: {
    subscribeToExternalTasks?: boolean;
  };
}

interface NextConfigFn {
  (phase: string, context?: any): Promise<NextConfig> | NextConfig;
}

export function withApplicationSDK(_nextConfig = {} as NextConfigWithApplicationSDKConfig): NextConfigFn {
  const { applicationSDK: applicationSDKConfig, ...nextConfig } = _nextConfig;

  return async (phase, context) => {
    if (applicationSDKConfig?.subscribeToExternalTasks) {
      await subscribeToExternalTasks();
    }

    return nextConfig;
  };
}
