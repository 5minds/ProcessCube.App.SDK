import { ProcessCostsService } from './ProcessCostsService';
import { RuntimeService } from './RuntimeService';

type HeatmapLevel = 'Critical' | 'Warning' | 'Stable';

export interface ProcessModel {
  customProperties: {
    runtime_warning?: string;
    runtime_critical?: string;
    cost_critical?: string;
    cost_warning?: string;
  };
  flowNodes: Array<{
    id: string;
    customProperties: {
      runtime_target?: string;
      runtime_warning?: string;
      runtime_critical?: string;
    };
  }>;
}

export interface BpmnViewer {
  getOverlays(): any;
  getElementRegistry(): any;
  clearHeatmap(data: string[]): void;
  showHeatmap(data: Record<string, HeatmapLevel>): void;
}

export interface NodeHeatmapInfo {
  status: HeatmapLevel;
  targetRuntime: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  warningSource?: 'Flow Node' | 'Process';
  criticalSource?: 'Flow Node' | 'Process';
}

function parseValidPercent(raw?: string): number | undefined {
  if (!raw) return undefined;
  const parsed = parseFloat(raw.replace('%', ''));
  if (isNaN(parsed)) return undefined;
  return parsed / 100;
}

export class HeatmapService {
  private nodeInfoMap: Record<string, NodeHeatmapInfo> = {};
  private heatmapInfo: Record<string, { [key: string]: NodeHeatmapInfo }> = {};
  private runtimeService: RuntimeService;
  private processCostsService: ProcessCostsService;
  private bpmnViewer: BpmnViewer | undefined;
  private activeCostKeyPerNode: Record<string, string> = {};

  constructor(runtimeService: RuntimeService, processCostsService: ProcessCostsService, processModel: ProcessModel) {
    this.runtimeService = runtimeService;
    this.processCostsService = processCostsService;
    this.computeRuntimeHeatmap(processModel);
    this.computeCostHeatmap(processModel);
  }

  public updateHeatmapService(
    runtimeService: RuntimeService,
    processCostsService: ProcessCostsService,
    processModel: ProcessModel,
  ) {
    this.runtimeService = runtimeService;
    this.processCostsService = processCostsService;
    this.computeRuntimeHeatmap(processModel);
    this.computeCostHeatmap(processModel);
  }

  public getHeatmapInfoForId(flowNodeId: string) {
    return this.heatmapInfo[flowNodeId];
  }

  public hasRuntimeEntry(): boolean {
    return Object.values(this.heatmapInfo).some((entry) => 'runtime' in entry);
  }

  public hasCostEntry(): boolean {
    return Object.values(this.heatmapInfo).some((entry) => Object.keys(entry).some((key) => key.startsWith('cost_')));
  }

  public getActiveCostKey(nodeId: string): string | undefined {
    return this.activeCostKeyPerNode[nodeId];
  }

  public hasMultipleCostEntries(flowNodeId: string): boolean {
    const entry = this.heatmapInfo[flowNodeId];
    if (!entry) return false;

    const costKeys = Object.keys(entry).filter((key) => key.startsWith('cost_'));
    return costKeys.length >= 2;
  }

  private computeCostHeatmap(processModel: ProcessModel): void {
    const allCosts = this.processCostsService.getAllProcessCosts?.();
    if (!allCosts) return;

    for (const [nodeId, costMap] of Object.entries(allCosts)) {
      for (const [costKey, costValue] of Object.entries(costMap)) {
        const average = costValue.average;
        if (average === undefined) continue;

        const criticalFactor = costValue.critical ?? parseValidPercent(processModel.customProperties.cost_critical);
        const warningFactor = costValue.warning ?? parseValidPercent(processModel.customProperties.cost_warning);

        const target = costValue.target;

        if (!target) continue;

        const warningThreshold = warningFactor ? target * warningFactor : undefined;
        const criticalThreshold = criticalFactor ? target * criticalFactor : undefined;

        if (warningThreshold && criticalThreshold && criticalThreshold < warningThreshold) continue;

        let status: HeatmapLevel = 'Stable';
        if (criticalThreshold !== undefined && average >= criticalThreshold) {
          status = 'Critical';
        } else if (
          warningThreshold !== undefined &&
          (criticalThreshold === undefined || warningThreshold < criticalThreshold) &&
          average >= warningThreshold
        ) {
          status = 'Warning';
        }

        const info: NodeHeatmapInfo = {
          status,
          targetRuntime: target,
          warningThreshold,
          criticalThreshold,
          warningSource: this.getHeatmapSource(costValue.warning, processModel.customProperties.cost_warning),
          criticalSource: this.getHeatmapSource(costValue.critical, processModel.customProperties.cost_critical),
        };

        if (!this.heatmapInfo[nodeId]) {
          this.heatmapInfo[nodeId] = {};
        }

        this.heatmapInfo[nodeId][costKey] = info;
      }
    }
  }

  private computeRuntimeHeatmap(processModel: ProcessModel): void {
    const processWarning = parseValidPercent(processModel.customProperties.runtime_warning);
    const processCritical = parseValidPercent(processModel.customProperties.runtime_critical);

    processModel.flowNodes.forEach((node) => {
      const stats = this.runtimeService.getStats(node.id);
      const averageRuntime = stats?.average;

      const targetRaw = node.customProperties.runtime_target;
      const targetRuntime = targetRaw ? Number(targetRaw) : undefined;
      if (!targetRuntime || isNaN(targetRuntime)) return;

      const nodeWarning = parseValidPercent(node.customProperties.runtime_warning);
      const nodeCritical = parseValidPercent(node.customProperties.runtime_critical);
      const warningFactor = nodeWarning ?? processWarning;
      const criticalFactor = nodeCritical ?? processCritical;

      const warningThreshold = warningFactor ? targetRuntime * warningFactor : undefined;
      const criticalThreshold = criticalFactor ? targetRuntime * criticalFactor : undefined;

      if (criticalThreshold && warningThreshold && criticalThreshold < warningThreshold) return;

      const runtimeInfo: Partial<NodeHeatmapInfo> = {
        targetRuntime,
        warningThreshold,
        criticalThreshold,
        warningSource: this.getHeatmapSource(nodeWarning, processWarning),
        criticalSource: this.getHeatmapSource(nodeCritical, processCritical),
      };

      if (averageRuntime !== undefined && (criticalThreshold || warningThreshold)) {
        let status: HeatmapLevel = 'Stable';
        if (criticalThreshold !== undefined && averageRuntime >= criticalThreshold) {
          status = 'Critical';
        } else if (
          warningThreshold !== undefined &&
          (criticalThreshold === undefined || warningThreshold < criticalThreshold) &&
          averageRuntime >= warningThreshold
        ) {
          status = 'Warning';
        }
        runtimeInfo.status = status;

        this.nodeInfoMap[node.id] = runtimeInfo as NodeHeatmapInfo;
      }

      this.heatmapInfo[node.id] = {
        runtime: runtimeInfo as NodeHeatmapInfo,
      };
    });
  }

  private getHeatmapSource(flowNodeStatus?: number, processStatus?: number | string) {
    return flowNodeStatus !== undefined ? 'Flow Node' : processStatus !== undefined ? 'Process' : undefined;
  }

  public applyHeatmap(showHeatmap: boolean, type: string, options: { viewer?: BpmnViewer; flowNodeId?: string }): void {
    const viewer = options.viewer;
    const flowNodeId = options.flowNodeId;

    if (!showHeatmap && viewer) {
      viewer.clearHeatmap(Object.keys(this.heatmapInfo));
    }

    if (!this.bpmnViewer && viewer) {
      this.bpmnViewer = viewer;
    }

    if (!viewer && flowNodeId) {
      const heatmapEntry = this.heatmapInfo[flowNodeId]?.[type];
      if (!heatmapEntry) return;
      const status = heatmapEntry.status;

      this.activeCostKeyPerNode[flowNodeId] = type;

      if (this.bpmnViewer) {
        this.bpmnViewer.showHeatmap({ [flowNodeId]: status });
      }
    }

    if (viewer) {
      const runtimeData = Object.entries(this.nodeInfoMap).reduce(
        (acc, [id, info]) => {
          acc[id] = info.status;
          return acc;
        },
        {} as Record<string, HeatmapLevel>,
      );

      const costData = Object.entries(this.heatmapInfo).reduce(
        (acc, [id, data]) => {
          const activeKey = this.activeCostKeyPerNode?.[id];

          if (activeKey && data[activeKey]?.status) {
            acc[id] = data[activeKey].status;
          } else {
            for (const [key, entry] of Object.entries(data)) {
              if (key.startsWith('cost_') && entry?.status) {
                acc[id] = entry.status;

                if (!this.activeCostKeyPerNode) {
                  this.activeCostKeyPerNode = {};
                }
                this.activeCostKeyPerNode[id] = key;

                break;
              }
            }
          }

          return acc;
        },
        {} as Record<string, HeatmapLevel>,
      );

      if (!showHeatmap) return;

      if (type !== 'runtime') {
        viewer.clearHeatmap(Object.keys(runtimeData));
        viewer.showHeatmap(costData);
      }

      if (type === 'runtime') {
        viewer.clearHeatmap(Object.keys(costData));
        viewer.showHeatmap(runtimeData);
      }
    }
  }
}
