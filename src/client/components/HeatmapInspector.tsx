import React, { useMemo } from 'react';

import { TimeRange } from '../../common/types';
import { HeatmapService } from '../services/HeatmapService';
import { ProcessCostsService } from '../services/ProcessCostsService';
import { RuntimeService } from '../services/RuntimeService';
import { formatDuration } from '../utils/formatInstances';

type HeatmapInspectorProps = {
  processModel: any;
  processCostsService?: ProcessCostsService;
  runtimeService?: RuntimeService;
  heatmapService?: HeatmapService;
  heatmapType: string;
  setHeatmapType: (type: string) => void;
  timeRange: TimeRange;
  setTimeRange: (value: TimeRange) => void;
  selectedInstance?: string;
};

export function HeatmapInspector({
  processModel,
  processCostsService,
  runtimeService,
  heatmapService,
  heatmapType,
  setHeatmapType,
  timeRange,
  setTimeRange,
  selectedInstance,
}: HeatmapInspectorProps) {
  const customStartDate = typeof timeRange !== 'string' ? timeRange.custom.startDate : undefined;
  const customEndDate = typeof timeRange !== 'string' ? timeRange.custom.endDate : undefined;

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TimeRange | 'custom';
    if (value === 'custom') {
      setTimeRange({ custom: { startDate: customStartDate, endDate: customEndDate } });
    } else {
      setTimeRange(value);
    }
  };

  const heatmapStatsMap = useMemo(() => {
    if (!heatmapService || !selectedInstance) return undefined;
    return heatmapService.getHeatmapInfoForId(selectedInstance);
  }, [heatmapService, selectedInstance]);

  const runtimeStats = useMemo(() => {
    if (!runtimeService || !selectedInstance) return undefined;
    return runtimeService.getStats(selectedInstance);
  }, [runtimeService, selectedInstance]);

  const processCosts = useMemo(() => {
    if (!processCostsService || !selectedInstance) return undefined;
    return processCostsService.getCostsForFlowNodeId(selectedInstance);
  }, [selectedInstance, processCostsService]);

  const instanceCount = useMemo((): number | undefined => {
    if (!processCostsService) return undefined;
    if (!selectedInstance) return processCostsService.getProcessInstanceCount();
    return processCostsService.getInstanceCount(selectedInstance) ?? processCostsService.getProcessInstanceCount();
  }, [selectedInstance, processCostsService]);

  const selectedNodeTitle = useMemo(() => {
    const flowNode = processModel.flowNodes.find((flowNode: any) => flowNode.id === selectedInstance);
    return flowNode
      ? `Flow Node: ${flowNode.id} (${flowNode.name})`
      : `Process: ${processModel.processModelId} (${processModel.processModelName})`;
  }, [selectedInstance, processModel]);

  const hasCostEntry = heatmapService?.hasCostEntry?.() ?? false;
  const hasRuntimeEntry = heatmapService?.hasRuntimeEntry?.() ?? false;
  const hasMultipleCostEntries =
    heatmapService && selectedInstance ? heatmapService.hasMultipleCostEntries(selectedInstance) : false;
  const mainHeatmapType = heatmapType === 'runtime' ? 'runtime' : 'processcosts';
  const activeCostType =
    heatmapService && selectedInstance ? heatmapService.getActiveCostKey(selectedInstance) : 'processcosts';

  const setAndApplyHeatmap = (value: string) => {
    if (selectedInstance) setHeatmapType(value);
    heatmapService?.applyHeatmap(true, value, { flowNodeId: selectedInstance });
  };

  return (
    <div className="app-sdk-flex app-sdk-flex-col app-sdk-h-full app-sdk-rounded-3xl app-sdk-p-4 app-sdk-gap-1 app-sdk-bg-white/95 dark:app-sdk-bg-black/85 dark:app-sdk-text-white app-sdk-border app-sdk-border-solid dark:app-sdk-border-none">
      <label>{selectedNodeTitle}</label>
      <div className="app-sdk-flex app-sdk-flex-col app-sdk-h-full app-sdk-rounded-3xl app-sdk-pb-3 app-sdk-gap-1">
        <label>Time Period:</label>
        <select value={typeof timeRange === 'string' ? timeRange : 'custom'} onChange={handleTimeRangeChange}>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="this_week">This Week</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="this_month">This Month</option>
          <option value="last_30_days">Last 30 Days</option>
          <option value="this_year">This Year</option>
          <option value="all">All Instances</option>
          <option value="custom">Custom</option>
        </select>

        {typeof timeRange !== 'string' && (
          <>
            <label className="app-sdk-w-full app-sdk-flex app-sdk-items-center app-sdk-gap-2">
              Start Date:
              <input
                className="app-sdk-px-2 app-sdk-flex-1 app-sdk-box-border"
                type="datetime-local"
                value={customStartDate ?? ''}
                onChange={(e) =>
                  setTimeRange({
                    custom: { startDate: e.target.value || undefined, endDate: customEndDate },
                  })
                }
              />
            </label>

            <label className="app-sdk-w-full app-sdk-flex app-sdk-items-center app-sdk-gap-2">
              End Date:
              <input
                className="app-sdk-px-2 app-sdk-flex-1"
                type="datetime-local"
                value={customEndDate ?? ''}
                onChange={(e) =>
                  setTimeRange({
                    custom: { startDate: customStartDate, endDate: e.target.value || undefined },
                  })
                }
              />
            </label>
          </>
        )}
      </div>

      <div className="app-sdk-flex app-sdk-flex-col app-sdk-h-full app-sdk-rounded-3xl app-sdk-pb-3 app-sdk-gap-1">
        <label className="app-sdk-flex app-sdk-items-center app-sdk-gap-2 app-sdk-text-sm">
          <span>Executed Instances: {instanceCount ?? 0}</span>
        </label>
      </div>

      {(hasRuntimeEntry || hasCostEntry) && (instanceCount ?? 0) > 0 && (
        <div className="app-sdk-flex app-sdk-flex-col app-sdk-h-full app-sdk-rounded-3xl app-sdk-pb-3 app-sdk-gap-1">
          {hasRuntimeEntry && hasCostEntry ? (
            <>
              <label className="app-sdk-flex app-sdk-items-center app-sdk-gap-2 app-sdk-text-sm">Heatmap Type:</label>
              <select value={mainHeatmapType} onChange={(e) => setHeatmapType(e.target.value)}>
                <option value="runtime">Runtimes</option>
                <option value="processcosts">Costs</option>
              </select>
            </>
          ) : (
            <label className="app-sdk-flex app-sdk-items-center app-sdk-gap-2 app-sdk-text-sm">
              Heatmap Type: {hasRuntimeEntry ? 'Runtimes' : 'Costs'}
            </label>
          )}
        </div>
      )}

      {runtimeService && (runtimeStats || heatmapStatsMap?.runtime) && (instanceCount ?? 0) > 0 && (
        <div className="app-sdk-flex app-sdk-flex-col app-sdk-h-full app-sdk-rounded-3xl app-sdk-pb-3 app-sdk-gap-1">
          <label className="app-sdk-flex app-sdk-items-center app-sdk-gap-2 app-sdk-text-sm">
            <span>Runtimes</span>
          </label>

          {runtimeStats && (
            <>
              <p className="app-sdk-ml-2 app-sdk-text-sm">Shortest Runtime: {formatDuration(runtimeStats.shortest)}</p>
              <p className="app-sdk-ml-2 app-sdk-text-sm">Longest Runtime: {formatDuration(runtimeStats.longest)}</p>
              <p className="app-sdk-ml-2 app-sdk-text-sm">Average Runtime: {formatDuration(runtimeStats.average)}</p>
            </>
          )}

          {heatmapStatsMap && heatmapStatsMap.runtime && (
            <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1">
              <p className="app-sdk-ml-2 app-sdk-text-sm">
                Reference Value: {formatDuration(heatmapStatsMap.runtime.referenceRuntime)}
              </p>
              {heatmapStatsMap.runtime.status && (
                <p className="app-sdk-ml-2 app-sdk-text-sm">Status: {heatmapStatsMap.runtime.status}</p>
              )}
              {heatmapStatsMap.runtime.warningThreshold && (
                <p className="app-sdk-ml-2 app-sdk-text-sm">
                  Warning Threshold: {formatDuration(heatmapStatsMap.runtime.warningThreshold)} (
                  {heatmapStatsMap.runtime.warningSource})
                </p>
              )}
              {heatmapStatsMap.runtime.criticalThreshold && (
                <p className="app-sdk-ml-2 app-sdk-text-sm">
                  Critical Threshold: {formatDuration(heatmapStatsMap.runtime.criticalThreshold)} (
                  {heatmapStatsMap.runtime.criticalSource})
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {processCosts && Object.entries(processCosts).length !== 0 && (
        <div className="app-sdk-flex app-sdk-flex-col app-sdk-h-full app-sdk-rounded-3xl app-sdk-gap-1">
          <label>Costs</label>

          {heatmapType !== 'runtime' && hasMultipleCostEntries && (
            <select value={activeCostType} onChange={(e) => setAndApplyHeatmap(e.target.value)}>
              {Object.keys(processCosts).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          )}

          {Object.entries(processCosts).map(([key, value]) => {
            const info = heatmapStatsMap?.[key];

            return (
              <div className="app-sdk-flex app-sdk-flex-col app-sdk-mb-2 app-sdk-ml-2" key={key}>
                <p className="app-sdk-text-sm">{key}</p>
                <p className="app-sdk-ml-2 app-sdk-text-sm">Total: {value.total}</p>
                {value.errors > 0 && <p className="app-sdk-ml-2 app-sdk-text-sm">Errors: {value.errors}</p>}
                <p className="app-sdk-ml-2 app-sdk-text-sm">Average Cost: {value.average.toFixed(2)}</p>
                {info && (
                  <>
                    <p className="app-sdk-ml-2 app-sdk-text-sm">Reference Value: {info.referenceRuntime}</p>
                    <p className="app-sdk-ml-2 app-sdk-text-sm">Status: {info.status}</p>
                    {info.warningThreshold && (
                      <p className="app-sdk-ml-2 app-sdk-text-sm">
                        Warning Threshold: {info.warningThreshold.toFixed(2)} ({info.warningSource})
                      </p>
                    )}
                    {info.criticalThreshold && (
                      <p className="app-sdk-ml-2 app-sdk-text-sm">
                        Critical Threshold: {info.criticalThreshold.toFixed(2)} ({info.criticalSource})
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
