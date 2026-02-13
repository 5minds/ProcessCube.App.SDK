import { withApplicationSdk } from '@5minds/processcube_app_sdk/server';

export default withApplicationSdk({
  applicationSdk: {
    useExternalTasks: true,
  },
});
