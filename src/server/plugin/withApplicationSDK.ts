import type { NextConfig } from 'next';
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from 'next/dist/shared/lib/constants';

import { subscribeToExternalTasks } from '../lib/ExternalTaskAdapter';

export interface NextConfigWithApplicationSdkConfig extends NextConfig {
  applicationSdk?: {
    customExternalTasksDirPath?: string;
    useExternalTasks?: boolean;
  };
}

interface NextConfigFn {
  (phase: string, context?: any): Promise<NextConfig> | NextConfig;
}

let isSubscribedToExternalTasks = false;
let isProductionBuild = false;

export function withApplicationSdk(config: NextConfigWithApplicationSdkConfig = {}): NextConfigFn {
  const { applicationSdk: applicationSdkConfig, ...nextConfig } = config;

  return async (phase, context) => {
    isProductionBuild = isProductionBuild || phase === PHASE_PRODUCTION_BUILD;
    const isStartingServer = phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_SERVER;
    const shouldSubscribeToExternalTasks =
      applicationSdkConfig?.useExternalTasks && isStartingServer && !isSubscribedToExternalTasks && !isProductionBuild;

    if (shouldSubscribeToExternalTasks) {
      isSubscribedToExternalTasks = true;
      await subscribeToExternalTasks(applicationSdkConfig?.customExternalTasksDirPath);
    }

    return {
      ...nextConfig,
      experimental: {
        ...nextConfig.experimental,
        serverComponentsExternalPackages: [
          ...(nextConfig.experimental?.serverComponentsExternalPackages || []),
          'esbuild',
        ],
      },
    };
  };
}
