import React, { useMemo, useState } from 'react';
import { useEffect } from 'react';

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
}: HeatmapInspectorProps) {
  const customStartDate = typeof timeRange !== 'string' ? timeRange.custom.startDate : undefined;
  const customEndDate = typeof timeRange !== 'string' ? timeRange.custom.endDate : undefined;

  const [selectedInstance, setSelectedInstance] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    return new URLSearchParams(window.location.search).get('selected') || undefined;
  });

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TimeRange | 'custom';
    if (value === 'custom') {
      setTimeRange({ custom: { startDate: customStartDate, endDate: customEndDate } });
    } else {
      setTimeRange(value);
    }
  };

  useEffect(() => {
    const updateSelectedInstance = () => {
      const params = new URLSearchParams(window.location.search);
      setSelectedInstance(params.get('selected') || undefined);
    };

    updateSelectedInstance();

    window.addEventListener('popstate', updateSelectedInstance);

    const origPushState = history.pushState;
    history.pushState = function (...args) {
      origPushState.apply(this, args);
      updateSelectedInstance();
    };
    const origReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      origReplaceState.apply(this, args);
      updateSelectedInstance();
    };

    return () => {
      window.removeEventListener('popstate', updateSelectedInstance);
      history.pushState = origPushState;
      history.replaceState = origReplaceState;
    };
  }, []);

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
    if (!processCostsService) return 0;
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
        <label>Zeitraum:</label>
        <select value={typeof timeRange === 'string' ? timeRange : 'custom'} onChange={handleTimeRangeChange}>
          <option value="today">Heute</option>
          <option value="yesterday">Gestern</option>
          <option value="this_week">Diese Woche</option>
          <option value="last_7_days">Letzte 7 Tage</option>
          <option value="this_month">Dieser Monat</option>
          <option value="last_30_days">Letzte 30 Tage</option>
          <option value="this_year">Dieses Jahr</option>
          <option value="all">Alle Instanzen</option>
          <option value="custom">Benutzerdefiniert</option>
        </select>

        {typeof timeRange !== 'string' && (
          <>
            <label>Startdatum:</label>
            <input
              type="datetime-local"
              value={customStartDate ?? ''}
              onChange={(e) =>
                setTimeRange({
                  custom: { startDate: e.target.value || undefined, endDate: customEndDate },
                })
              }
            />

            <label>Enddatum:</label>
            <input
              type="datetime-local"
              value={customEndDate ?? ''}
              onChange={(e) =>
                setTimeRange({
                  custom: { startDate: customStartDate, endDate: e.target.value || undefined },
                })
              }
            />
          </>
        )}
      </div>

      {(hasRuntimeEntry || hasCostEntry) && (
        <div className="app-sdk-flex app-sdk-flex-col app-sdk-h-full app-sdk-rounded-3xl app-sdk-pb-3 app-sdk-gap-1">
          <label className="app-sdk-flex app-sdk-items-center app-sdk-gap-2 app-sdk-text-sm">Heatmap Typ:</label>
          <select value={mainHeatmapType} onChange={(e) => setHeatmapType(e.target.value)}>
            {hasRuntimeEntry && <option value="runtime">Laufzeiten</option>}
            {hasCostEntry && <option value="processcosts">Prozesskosten</option>}
          </select>
        </div>
      )}

      <div className="app-sdk-flex app-sdk-flex-col app-sdk-h-full app-sdk-rounded-3xl app-sdk-pb-3 app-sdk-gap-1">
        <label className="app-sdk-flex app-sdk-items-center app-sdk-gap-2 app-sdk-text-sm">
          <span>Gelaufene Instanzen: {instanceCount}</span>
        </label>
      </div>

      {runtimeService && (runtimeStats || heatmapStatsMap?.runtime) && (
        <div className="app-sdk-flex app-sdk-flex-col app-sdk-h-full app-sdk-rounded-3xl app-sdk-pb-3 app-sdk-gap-1">
          <label className="app-sdk-flex app-sdk-items-center app-sdk-gap-2 app-sdk-text-sm">
            <span>Laufzeiten</span>
          </label>

          {heatmapStatsMap && heatmapStatsMap.runtime && (
            <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1">
              {heatmapStatsMap.runtime.status && (
                <p className="app-sdk-ml-2 app-sdk-text-sm">Status: {heatmapStatsMap.runtime.status}</p>
              )}
              <p className="app-sdk-ml-2 app-sdk-text-sm">
                Target: {formatDuration(heatmapStatsMap.runtime.targetRuntime)}
              </p>
              {heatmapStatsMap.runtime.warningThreshold && (
                <p className="app-sdk-ml-2 app-sdk-text-sm">
                  Warning: {formatDuration(heatmapStatsMap.runtime.warningThreshold)} (
                  {heatmapStatsMap.runtime.warningSource})
                </p>
              )}
              {heatmapStatsMap.runtime.criticalThreshold && (
                <p className="app-sdk-ml-2 app-sdk-text-sm">
                  Critical: {formatDuration(heatmapStatsMap.runtime.criticalThreshold)} (
                  {heatmapStatsMap.runtime.criticalSource})
                </p>
              )}
            </div>
          )}

          {runtimeStats && (
            <>
              <p className="app-sdk-ml-2 app-sdk-text-sm">
                Durchschnittliche Laufzeit: {formatDuration(runtimeStats.average)}
              </p>
              <p className="app-sdk-ml-2 app-sdk-text-sm">Kürzeste Laufzeit: {formatDuration(runtimeStats.shortest)}</p>
              <p className="app-sdk-ml-2 app-sdk-text-sm">Längste Laufzeit: {formatDuration(runtimeStats.longest)}</p>
            </>
          )}
        </div>
      )}

      {processCosts && Object.entries(processCosts).length !== 0 && (
        <div className="app-sdk-flex app-sdk-flex-col app-sdk-h-full app-sdk-rounded-3xl app-sdk-gap-1">
          <label>Prozesskosten</label>

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
                <p className="app-sdk-ml-2 app-sdk-text-sm">Gesamt: {value.total}</p>
                <p className="app-sdk-ml-2 app-sdk-text-sm">Durchschnitt: {value.average.toFixed(2)}</p>
                {value.errors > 0 && <p className="app-sdk-ml-2 app-sdk-text-sm">Errors: {value.errors}</p>}
                {info && (
                  <>
                    <p className="app-sdk-ml-2 app-sdk-text-sm">Status: {info.status}</p>
                    <p className="app-sdk-ml-2 app-sdk-text-sm">Target: {info.targetRuntime}</p>
                    {info.warningThreshold && (
                      <p className="app-sdk-ml-2 app-sdk-text-sm">
                        Warning: {info.warningThreshold.toFixed(2)} ({info.warningSource})
                      </p>
                    )}
                    {info.criticalThreshold && (
                      <p className="app-sdk-ml-2 app-sdk-text-sm">
                        Critical: {info.criticalThreshold.toFixed(2)} ({info.criticalSource})
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
