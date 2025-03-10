import { calculateTimeBetweenTimestamps } from './calculations';

export async function getTimesFromProcessInstances(instances: any[]) {
  const extractedDatesFromProcessInstance: Date[] = [];

  for (const instance of instances) {
    const { processStartedAt, processFinishedAt } = instance.process_instance;

    if (processStartedAt && processFinishedAt) {
      extractedDatesFromProcessInstance.push(new Date(processStartedAt), new Date(processFinishedAt));
    }
  }

  const calculatedTimes = calculateTimeBetweenTimestamps(extractedDatesFromProcessInstance);

  return calculatedTimes;
}

export async function getTimesFromFlowNodeInstances(flowNodeIds: string[], instances: any[]) {
  const extractedDatesFromProcessInstance: Date[] = [];

  for (const instance of instances) {
    if (instance.process_instance.processStartedAt && instance.process_instance.processFinishedAt) {
      extractedDatesFromProcessInstance.push(
        instance.process_instance.processStartedAt,
        instance.process_instance.processFinishedAt,
      );
    }
  }

  const calculatedTimes = calculateTimeBetweenTimestamps(extractedDatesFromProcessInstance);
}
