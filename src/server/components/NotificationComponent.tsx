import { getIdentity, waitForUserTask } from '../lib';

import { Client } from '../lib/internal/EngineClient';

export const getTasks = async () => {

  // console.log('NotificationComponent');
  // const userTask = await waitForUserTask();
  // console.log(userTask);

  const key = 'portal:flowNodeInstance:seen';
  const value = true;
  const identity = await getIdentity();

  console.log('identity', identity);


  // await Client.userMetadata.set(key, value, identity);;

  // const metadata = await Client.userMetadata.query(key, identity);
  // console.log(metadata)

  return (
    <></>
  );
};
