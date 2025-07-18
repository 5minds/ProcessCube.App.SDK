import { RuntimeResults } from '../../common/types';
import { getAverageRuntime, getLongestRuntime, getShortestRuntime } from '../utils/calculations';

type AggregatedRuntimes = {
  average: number;
  shortest: number;
  longest: number;
};

type RuntimeMap = Record<string, AggregatedRuntimes>;

export class RuntimeService {
  private runtimeStatsById: RuntimeMap;

  constructor(instances: any[], processModelHash: string) {
    const runtimes = this.setMappedRuntimes(instances, processModelHash);
    this.runtimeStatsById = this.aggregateRuntimes(runtimes);
  }

  public getStats(flowNodeId: string): AggregatedRuntimes {
    const timesById = this.runtimeStatsById[flowNodeId];

    if (timesById) return timesById;

    const firstKey = Object.keys(this.runtimeStatsById)[0];

    return this.runtimeStatsById[firstKey];
  }

  private aggregateRuntimes(runtimes: RuntimeResults[]): RuntimeMap {
    const stats: RuntimeMap = {};

    for (const runtime of runtimes) {
      const times = Object.values(runtime.instances);
      if (times.length === 0) continue;

      stats[runtime.id] = {
        average: getAverageRuntime(times) ?? 0,
        shortest: getShortestRuntime(times) ?? 0,
        longest: getLongestRuntime(times) ?? 0,
      };
    }

    return stats;
  }

  private setMappedRuntimes(instances: any[], processModelHash: string): RuntimeResults[] {
    const flowNodeRuntimes = this.getFlowNodeTimes(instances);
    const processInstanceRuntimes = this.getTimesFromProcessInstances(instances);

    flowNodeRuntimes.unshift({ id: processModelHash, instances: processInstanceRuntimes });

    return flowNodeRuntimes;
  }

  private getTimesFromProcessInstances(instances: any[]) {
    const runtimesByInstance: Record<string, number> = {};

    for (const instance of instances) {
      const { processInstanceId, processStartedAt, processFinishedAt } = instance.process_instance;

      if (processInstanceId && processStartedAt && processFinishedAt) {
        const start = new Date(processStartedAt).getTime();
        const end = new Date(processFinishedAt).getTime();
        const runtime = end - start;

        runtimesByInstance[processInstanceId] = runtime;
      }
    }

    return runtimesByInstance;
  }

  private getFlowNodeTimes(instances: any[]): RuntimeResults[] {
    const instanceMap = new Map<string, Map<string, { enteredAt?: number; exitedAt?: number }>>();

    instances.forEach((processInstance) => {
      const flowNodeInstances = processInstance.process_instance.flowNodeInstances;

      flowNodeInstances.forEach((instance: any) => {
        const flowNodeId = instance.id;
        const instanceId = instance.flowNodeInstanceId;
        const enteredAt = instance.flowNodeEnteredAt ? new Date(instance.flowNodeEnteredAt).getTime() : undefined;
        const exitedAt = instance.flowNodeExitedAt ? new Date(instance.flowNodeExitedAt).getTime() : undefined;

        if (!flowNodeId || !instanceId) return;

        if (!instanceMap.has(flowNodeId)) {
          instanceMap.set(flowNodeId, new Map());
        }

        const flowNodeMap = instanceMap.get(flowNodeId)!;

        if (!flowNodeMap.has(instanceId)) {
          flowNodeMap.set(instanceId, {});
        }

        const timing = flowNodeMap.get(instanceId)!;

        if (enteredAt !== undefined) {
          if (!timing.enteredAt || enteredAt < timing.enteredAt) {
            timing.enteredAt = enteredAt;
          }
        }

        if (exitedAt !== undefined) {
          if (!timing.exitedAt || exitedAt > timing.exitedAt) {
            timing.exitedAt = exitedAt;
          }
        }
      });
    });

    return Array.from(instanceMap.entries()).map(([flowNodeId, instanceMap]) => {
      const instances: Record<string, number> = {};

      instanceMap.forEach((timing, instanceId) => {
        if (timing.enteredAt !== undefined && timing.exitedAt !== undefined) {
          instances[instanceId] = timing.exitedAt - timing.enteredAt;
        }
      });

      return {
        id: flowNodeId,
        instances,
      };
    });
  }
}
