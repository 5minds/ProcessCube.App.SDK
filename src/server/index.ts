import 'server-only';

import { setEngineUrl } from './lib/internal/EngineUrlConfig';

export default {
  config: ({ engineUrl }: { engineUrl: string }) => {
    if (typeof engineUrl === 'string') {
      setEngineUrl(engineUrl);
    }
  },
};

export * from './lib';
export * from './server-actions';
