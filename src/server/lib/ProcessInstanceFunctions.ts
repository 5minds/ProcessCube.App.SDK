import { DataModels } from '@5minds/processcube_engine_client';
import type { EventMessage, Identity, Subscription } from '@5minds/processcube_engine_sdk';

import { getIdentity } from './getIdentity';
import { Client } from './internal/EngineClient';

/**
 * @param query.query The query of {@link Client.processInstances.query}
 * @param query.options The options of {@link Client.processInstances.query}
 * @returns The list of active process instances as promise {@link DataModels.ProcessInstances.ProcessInstanceList}
 */
export async function getActiveProcessInstances(query?: {
  query?: Omit<DataModels.ProcessInstances.ProcessInstanceQuery, 'state'>;
  options?: Parameters<typeof Client.processInstances.query>[1];
}): Promise<DataModels.ProcessInstances.ProcessInstanceList> {
  const result = await Client.processInstances.query(
    {
      ...query?.query,
      state: DataModels.ProcessInstances.ProcessInstanceState.running,
    },
    query?.options,
  );

  return result;
}

/**
 * This function will wait until a ProcessInstance is finished, terminated or errored.
 * If the processInstance is already finished, it will instantly be returned.
 *
 * @param filterBy Additional filter options
 * @param filterBy.processInstanceId The ID of the ProcessInstance to wait for
 * @param identity The Identity of the User
 * @param useImpliedIdentity Defines wheter the implied identity of the current User should be used
 * @returns {Promise<DataModels.ProcessInstances.ProcessInstance>} The ProcessInstance.
 */
export async function waitForProcessEnd(
  filterBy: {
    processInstanceId?: string;
  },
  identity?: Identity,
  useImpliedIdentity?: boolean,
): Promise<DataModels.ProcessInstances.ProcessInstance> {
  const { processInstanceId } = filterBy;
  const impliedIdentity = useImpliedIdentity ? await getIdentity() : undefined;

  return new Promise<DataModels.ProcessInstances.ProcessInstance>(async (resolve, reject) => {
    const subscriptions: Array<Subscription> = [];

    const handleSubscription = async (event: EventMessage) => {
      const processInstanceIdGivenButNotMatching =
        processInstanceId !== undefined && event.processInstanceId !== processInstanceId;

      if (processInstanceIdGivenButNotMatching) {
        return;
      }

      const processInstance = await Client.processInstances.query(
        { processInstanceId: event.processInstanceId },
        { identity: identity || impliedIdentity },
      );
      for (const sub of subscriptions) {
        Client.notification.removeSubscription(sub, identity || impliedIdentity);
      }

      if (processInstance.totalCount === 0) {
        return reject(new Error(`Process with instance ID "${event.processInstanceId}" does not exist.`));
      }

      return resolve(processInstance.processInstances[0]);
    };

    subscriptions.push(
      await Client.notification.onProcessEnded(handleSubscription, { identity: identity || impliedIdentity }),
    );
    subscriptions.push(
      await Client.notification.onProcessError(handleSubscription, { identity: identity || impliedIdentity }),
    );
    subscriptions.push(
      await Client.notification.onProcessTerminated(handleSubscription, { identity: identity || impliedIdentity }),
    );

    if (processInstanceId) {
      const finishedProcessInstance = await Client.processInstances.query(
        {
          processInstanceId,
          state: [
            DataModels.ProcessInstances.ProcessInstanceState.finished,
            DataModels.ProcessInstances.ProcessInstanceState.terminated,
            DataModels.ProcessInstances.ProcessInstanceState.error,
          ],
        },
        { identity: identity || impliedIdentity },
      );

      if (finishedProcessInstance.totalCount > 0) {
        for (const sub of subscriptions) {
          Client.notification.removeSubscription(sub, identity || impliedIdentity);
        }
        resolve(finishedProcessInstance.processInstances[0]);
      }
    }
  });
}
