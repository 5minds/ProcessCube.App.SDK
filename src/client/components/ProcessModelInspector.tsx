'use client';

import { Transition } from '@headlessui/react';
import dynamic from 'next/dynamic';
import React from 'react';
import { useEffect, useState } from 'react';

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
    options?: {
      timeRange: TimeRange;
    },
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

  const setServices = (instances: any) => {
    const { processModel, getInstancesFromDatabase } = props;

    if (!getInstancesFromDatabase || !processModel?.processModelId || !processModel?.hash) return;

    const newRuntimeService = new RuntimeService(instances, processModel.hash);
    const newProcessCostsService = new ProcessCostsService(instances, processModel.flowNodes);

    setRuntimeService(newRuntimeService);
    setProcessCostsService(newProcessCostsService);

    const oldHeatmapService = heatmapService;
    if (!oldHeatmapService) {
      const newHeatmapService = new HeatmapService(newRuntimeService, newProcessCostsService, processModel);
      setHeatmapService(newHeatmapService);

      if (newHeatmapService.hasRuntimeEntry()) {
        setHeatmapType('runtime');
      } else if (newHeatmapService.hasCostEntry()) {
        setHeatmapType('processcosts');
      }
    } else {
      heatmapService.updateHeatmapService(newRuntimeService, newProcessCostsService, processModel);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isHeatmapInspectorOpen = searchParams.get('heatmapInspector');
    if (isHeatmapInspectorOpen === 'true') {
      setIsHeatmapInspectorOpen(true);
    }

    const loadInitialData = async () => {
      if (!props.getInstancesFromDatabase) return;

      const instances = await props.getInstancesFromDatabase(
        props.processModel.processModelId,
        props.processModel.hash,
        { timeRange: 'today' },
      );

      if (instances.length > 0) {
        setShowHeatmap(true);
        setServices(instances);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const fetchFilteredData = async () => {
      if (!filters || !props.getInstancesFromDatabase) return;

      const instances = await props.getInstancesFromDatabase(
        props.processModel.processModelId,
        props.processModel.hash,
        filters,
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
  }, [filters]);

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
                onChange={setFilters}
                heatmapType={heatmapType}
                setHeatmapType={setHeatmapType}
              />
            </div>
          </Transition>
        </>
      )}
      <DiagramDocumentationInspector
        xml={props.processModel.xml}
        processModel={props.processModel}
        runtimeService={runtimeService}
        heatmapService={heatmapService}
        showHeatmap={showHeatmap}
        heatmapType={heatmapType}
      />
    </div>
  );
}

export const ProcessModelInspectorNextJS = dynamic(() => Promise.resolve(ProcessModelInspector), {
  ssr: false,
}) as unknown as (props: ProcessModelInspectorProps) => React.JSX.Element;
