import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_SERVER } from 'next/dist/shared/lib/constants';

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
    const shouldSubscribeToExternalTasks =
      applicationSDKConfig?.subscribeToExternalTasks &&
      (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_SERVER);

    if (shouldSubscribeToExternalTasks) {
      await subscribeToExternalTasks();
    }

    return nextConfig;
  };
}
