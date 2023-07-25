import { getIdentity, waitForUserTask } from '../lib';

import { Client } from '../lib/internal/EngineClient';

export const NotificationComponent = async () => {

  // console.log('NotificationComponent');
  // const userTask = await waitForUserTask();
  // console.log(userTask);

  const key = 'portal:flowNodeInstance:seen';
  const identity = await getIdentity();
  const metadata = await Client.userMetadata.query(key, identity);
  console.log(metadata)

  return (
    <div>
      <div>NotificationComponent</div>
      {/* <NotificationIcon></NotificationIcon> */}
    </div>
  );
};
