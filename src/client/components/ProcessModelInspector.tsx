'use client';

import { Transition } from '@headlessui/react';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

import { FilterOptions, TimeRange } from '../../common/types';
import { HeatmapService } from '../services';
import { ProcessCostsService } from '../services';
import { RuntimeService } from '../services';
import { DiagramDocumentationInspector } from './DiagramDocumentationInspector';
import { HeatmapInspector } from './HeatmapInspector';
import { ProcessButtonsContainer } from './ProcessInstanceInspector/ProcessButtonsContainer';
import { TokenInspectorButton } from './ProcessInstanceInspector/TokenInspectorButton';

type ProcessModelInspectorProps = {
  processModel?: any;
  getInstancesFromDatabase?: (
    processModelId: string,
    hash: string,
    options?: { timeRange: TimeRange },
  ) => Promise<any[]>;
};

function ProcessModelInspector(props: ProcessModelInspectorProps) {
  const [isHeatmapInspectorOpen, setIsHeatmapInspectorOpen] = useState(false);
  const [processCostsService, setProcessCostsService] = useState<ProcessCostsService | undefined>();
  const [runtimeService, setRuntimeService] = useState<RuntimeService | undefined>();
  const [heatmapService, setHeatmapService] = useState<HeatmapService | undefined>();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [filters, setFilters] = useState<FilterOptions | undefined>(undefined);
  const [heatmapType, setHeatmapType] = useState<string>('runtime');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');

  const setServices = (instances: any) => {
    const { processModel } = props;
    if (!processModel?.processModelId || !processModel?.hash) return;

    const newRuntimeService = new RuntimeService(instances, processModel.hash);
    const newProcessCostsService = new ProcessCostsService(instances, processModel.flowNodes);

    setRuntimeService(newRuntimeService);
    setProcessCostsService(newProcessCostsService);

    if (!heatmapService) {
      const newHeatmapService = new HeatmapService(newRuntimeService, newProcessCostsService, processModel);
      setHeatmapService(newHeatmapService);

      if (newHeatmapService.hasRuntimeEntry()) setHeatmapType('runtime');
      else if (newHeatmapService.hasCostEntry()) setHeatmapType('processcosts');
    } else {
      heatmapService.updateHeatmapService(newRuntimeService, newProcessCostsService, processModel);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get('heatmapInspector') === 'true') setIsHeatmapInspectorOpen(true);

    const timeRangeParam = searchParams.get('timeRange');
    let initialTimeRange: TimeRange = 'today';

    if (timeRangeParam === 'custom') {
      const start = searchParams.get('startDate') || undefined;
      const end = searchParams.get('endDate') || undefined;
      initialTimeRange = { custom: { startDate: start, endDate: end } };
    } else if (timeRangeParam) {
      initialTimeRange = timeRangeParam as Exclude<TimeRange, object>;
    }

    setTimeRange(initialTimeRange);
    setFilters({ timeRange: initialTimeRange });

    const loadData = async () => {
      if (!props.getInstancesFromDatabase || !props.processModel?.processModelId || !props.processModel?.hash) return;

      const instances = await props.getInstancesFromDatabase(
        props.processModel.processModelId,
        props.processModel.hash,
        { timeRange: initialTimeRange },
      );

      if (instances.length > 0) {
        setShowHeatmap(true);
        setServices(instances);
      }
    };

    loadData();
  }, [props.getInstancesFromDatabase, props.processModel]);

  useEffect(() => {
    if (
      !filters?.timeRange ||
      !props.getInstancesFromDatabase ||
      !props.processModel?.processModelId ||
      !props.processModel?.hash
    )
      return;

    const fetchFilteredData = async () => {
      if (!props.getInstancesFromDatabase) return;

      const instances = await props.getInstancesFromDatabase(
        props.processModel.processModelId,
        props.processModel.hash,
        { timeRange: filters.timeRange },
      );

      if (instances.length > 0) {
        setShowHeatmap(true);
        setServices(instances);
      } else {
        setShowHeatmap(false);
        setProcessCostsService(undefined);
        setRuntimeService(undefined);
      }
    };

    fetchFilteredData();
  }, [filters, props.getInstancesFromDatabase, props.processModel]);

  const toggleInspector = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const isOpen = searchParams.get('heatmapInspector') === 'true';

    if (isOpen) {
      searchParams.delete('heatmapInspector');
      setIsHeatmapInspectorOpen(false);
    } else {
      searchParams.set('heatmapInspector', 'true');
      setIsHeatmapInspectorOpen(true);
    }

    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`,
    );
  };

  const handleTimeRangeChange = (newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange);
    setFilters({ timeRange: newTimeRange });

    const params = new URLSearchParams(window.location.search);

    if (typeof newTimeRange === 'string') {
      params.set('timeRange', newTimeRange);
      params.delete('startDate');
      params.delete('endDate');
    } else {
      params.set('timeRange', 'custom');
      if (newTimeRange.custom.startDate) params.set('startDate', newTimeRange.custom.startDate);
      else params.delete('startDate');

      if (newTimeRange.custom.endDate) params.set('endDate', newTimeRange.custom.endDate);
      else params.delete('endDate');
    }

    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="app-sdk-relative app-sdk-w-full app-sdk-h-full">
      {props.getInstancesFromDatabase && (
        <>
          <ProcessButtonsContainer>
            <TokenInspectorButton isOpen={isHeatmapInspectorOpen} open={toggleInspector} close={toggleInspector} />
          </ProcessButtonsContainer>

          <Transition show={isHeatmapInspectorOpen}>
            <div className="app-sdk-transition app-sdk-duration-200 data-[closed]:app-sdk-opacity-0 app-sdk-w-1/4 app-sdk-min-w-64 app-sdk-absolute app-sdk-top-0 app-sdk-right-0 app-sdk-z-40 app-sdk-pt-2 app-sdk-pr-2">
              <HeatmapInspector
                processModel={props.processModel}
                processCostsService={processCostsService}
                runtimeService={runtimeService}
                heatmapService={heatmapService}
                heatmapType={heatmapType}
                setHeatmapType={setHeatmapType}
                timeRange={timeRange}
                setTimeRange={handleTimeRangeChange}
              />
            </div>
          </Transition>
        </>
      )}

      <DiagramDocumentationInspector
        xml={props.processModel?.xml}
        processModel={props.processModel}
        heatmapService={heatmapService}
        showHeatmap={showHeatmap}
        heatmapType={heatmapType}
      />
    </div>
  );
}

export const ProcessModelInspectorNextJS = dynamic(() => Promise.resolve(ProcessModelInspector), {
  ssr: false,
});
