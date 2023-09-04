import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_SERVER } from 'next/dist/shared/lib/constants';

import { subscribeToExternalTasks } from '../lib/ExternalTaskAdapter';

export interface NextConfigWithApplicationSdkConfig extends NextConfig {
  applicationSDK?: {
    customExternalTasksDirPath?: string;
    useExternalTasks?: boolean;
  };
}

interface NextConfigFn {
  (phase: string, context?: any): Promise<NextConfig> | NextConfig;
}

export function withApplicationSdk(config: NextConfigWithApplicationSdkConfig = {}): NextConfigFn {
  const { applicationSDK: applicationSDKConfig, ...nextConfig } = config;

  return async (phase, context) => {
    const isStartingServer = phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_SERVER;
    const shouldSubscribeToExternalTasks = applicationSDKConfig?.useExternalTasks && isStartingServer;

    if (shouldSubscribeToExternalTasks) {
      await subscribeToExternalTasks(applicationSDKConfig?.customExternalTasksDirPath);
    }

    return nextConfig;
  };
}
