import { DataModels } from '@5minds/processcube_engine_client';

import { getIdentity, getWaitingUserTasks, waitForUserTask } from '../lib';

export const getTasks = async () => {
  // console.log('getTasks called');

  // const identity = await getIdentity();
  // const options = {
  //   identity,
  // };

  const options = {};

  // Fetch all initial tasks
  const initialTasks = (await getWaitingUserTasks(options)) || [];
  // console.log('Initial tasks', initialTasks);

  // Function to get updated tasks with a Promise
  const getUpdatedTasks = (): any => {
    return new Promise(async (resolve, reject) => {
      try {
        const userTask = await waitForUserTask();
        // console.log('Received updated task', userTask);
        resolve(userTask);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Subscribe and listen for new tasks
  const subscribeForTasks = async () => {
    try {
      while (true) {
        const updatedTask = await getUpdatedTasks();
        // Do something with the updated task (e.g., update the tasks array)
        // For example, you can add the updated task to the initialTasks array
        initialTasks.push(updatedTask);
        // console.log('Updated tasks', initialTasks);
      }
    } catch (error) {
      console.error('Error while subscribing for tasks:', error);
    }
  };

  // Start subscribing for new tasks (this will run in the background)
  subscribeForTasks();

  // Return the initial tasks
  return initialTasks;
};
