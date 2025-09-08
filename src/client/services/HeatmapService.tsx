import { ProcessCostsService } from './ProcessCostsService';
import { RuntimeService } from './RuntimeService';

type HeatmapLevel = 'Critical' | 'Warning' | 'Stable';

export interface ProcessModel {
  customProperties: {
    'pilot.setRuntime.warning'?: string;
    'pilot.setRuntime.critical'?: string;
    'pilot.setProcessCosts.warning'?: string;
    'pilot.setProcessCosts.critical'?: string;
  };
  flowNodes: Array<{
    id: string;
    customProperties: {
      'pilot.setRuntime.target'?: string;
      'pilot.setRuntime.warning'?: string;
      'pilot.setRuntime.critical'?: string;
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
    return Object.values(this.heatmapInfo).some((entry) =>
      Object.keys(entry).some((key) => !key.startsWith('runtime')),
    );
  }

  public getActiveCostKey(nodeId: string): string | undefined {
    return this.activeCostKeyPerNode[nodeId];
  }

  public hasMultipleCostEntries(flowNodeId: string): boolean {
    const entry = this.heatmapInfo[flowNodeId];
    if (!entry) return false;

    const costKeys = Object.keys(entry).filter((key) => !key.startsWith('runtime'));
    return costKeys.length >= 2;
  }

  public applyHeatmap(showHeatmap: boolean, type: string, options: { viewer?: BpmnViewer; flowNodeId?: string }): void {
    const viewer = options.viewer;
    const flowNodeId = options.flowNodeId;

    if (!viewer && !flowNodeId) return;

    if (!showHeatmap && viewer) {
      viewer.clearHeatmap(Object.keys(this.heatmapInfo));
    }

    if (!this.bpmnViewer && viewer) {
      this.bpmnViewer = viewer;
    }

    if (!viewer && flowNodeId) {
      const status = this.heatmapInfo[flowNodeId]?.[type]?.status;
      if (!status) return;

      this.activeCostKeyPerNode[flowNodeId] = type;
      this.bpmnViewer?.showHeatmap({ [flowNodeId]: status });
      return;
    }

    if (!viewer) return;

    const runtimeData: Record<string, HeatmapLevel> = {};
    const costData: Record<string, HeatmapLevel> = {};

    for (const [id, info] of Object.entries(this.nodeInfoMap)) {
      runtimeData[id] = info.status;
    }

    for (const [id, data] of Object.entries(this.heatmapInfo)) {
      const activeKey = this.activeCostKeyPerNode?.[id];
      if (activeKey && data[activeKey]?.status) {
        costData[id] = data[activeKey]!.status;
        continue;
      }

      for (const [key, entry] of Object.entries(data)) {
        if (!key.startsWith('runtime') && entry?.status) {
          costData[id] = entry.status;
          this.activeCostKeyPerNode = this.activeCostKeyPerNode;
          this.activeCostKeyPerNode[id] = key;
          break;
        }
      }
    }

    if (type === 'runtime') {
      viewer.clearHeatmap(Object.keys(costData));
      viewer.showHeatmap(runtimeData);
    } else {
      viewer.clearHeatmap(Object.keys(runtimeData));
      viewer.showHeatmap(costData);
    }
  }

  private computeCostHeatmap(processModel: ProcessModel): void {
    const allCosts = this.processCostsService.getAllProcessCosts?.();
    if (!allCosts) return;

    for (const [nodeId, costMap] of Object.entries(allCosts)) {
      for (const [costKey, costValue] of Object.entries(costMap)) {
        const average = costValue.average;
        if (average === undefined) continue;

        const criticalFactor =
          costValue.critical ?? parseValidPercent(processModel.customProperties['pilot.setProcessCosts.critical']);
        const warningFactor =
          costValue.warning ?? parseValidPercent(processModel.customProperties['pilot.setProcessCosts.warning']);

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
          warningSource: this.getHeatmapSource(
            costValue.warning,
            processModel.customProperties['pilot.setProcessCosts.warning'],
          ),
          criticalSource: this.getHeatmapSource(
            costValue.critical,
            processModel.customProperties['pilot.setProcessCosts.critical'],
          ),
        };

        if (!this.heatmapInfo[nodeId]) {
          this.heatmapInfo[nodeId] = {};
        }

        this.heatmapInfo[nodeId][costKey] = info;
      }
    }
  }

  private computeRuntimeHeatmap(processModel: ProcessModel): void {
    const processWarning = parseValidPercent(processModel.customProperties['pilot.setRuntime.warning']);
    const processCritical = parseValidPercent(processModel.customProperties['pilot.setRuntime.critical']);

    processModel.flowNodes.forEach((node) => {
      const stats = this.runtimeService.getStats(node.id);
      const averageRuntime = stats?.average;

      const targetRaw = node.customProperties['pilot.setRuntime.target'];
      const targetRuntime = targetRaw ? Number(targetRaw) : undefined;
      if (!targetRuntime || isNaN(targetRuntime)) return;

      const nodeWarning = parseValidPercent(node.customProperties['pilot.setRuntime.warning']);
      const nodeCritical = parseValidPercent(node.customProperties['pilot.setRuntime.critical']);
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
}
