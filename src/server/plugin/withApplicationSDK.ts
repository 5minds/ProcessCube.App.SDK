import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_SERVER } from 'next/dist/shared/lib/constants';

import { subscribeToExternalTasks } from '../lib/ExternalTaskAdapter';

let alreadySubscribedToExternalTasks = false;

export interface NextConfigWithApplicationSdkConfig extends NextConfig {
  applicationSdk?: {
    customExternalTasksDirPath?: string;
    useExternalTasks?: boolean;
  };
}

interface NextConfigFn {
  (phase: string, context?: any): Promise<NextConfig> | NextConfig;
}

export function withApplicationSdk(config: NextConfigWithApplicationSdkConfig = {}): NextConfigFn {
  const { applicationSdk: applicationSdkConfig, ...nextConfig } = config;

  return async (phase, context) => {
    const isStartingServer = phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_SERVER;
    const shouldSubscribeToExternalTasks =
      applicationSdkConfig?.useExternalTasks && isStartingServer && !alreadySubscribedToExternalTasks;

    if (shouldSubscribeToExternalTasks) {
      await subscribeToExternalTasks(applicationSdkConfig?.customExternalTasksDirPath);
      alreadySubscribedToExternalTasks = true;
    }

    return nextConfig;
  };
}
