import React, { useEffect, useState } from 'react';

import { FlowNodeInstance } from '@5minds/processcube_engine_sdk';

import { TokenViewer } from './TokenViewer';

export function FlowNodeTokenViewer({ flowNodeInstances }: { flowNodeInstances: FlowNodeInstance[] }) {
  const [selectedInstance, setSelectedInstance] = useState<FlowNodeInstance>();

  useEffect(() => {
    if (!selectedInstance) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('selectedTokenFlowNodeId', selectedInstance.flowNodeId);

    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`,
    );
  }, [selectedInstance]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const selectedTokenFlowNodeId = searchParams.get('selectedTokenFlowNodeId');
    const selectedInstance = flowNodeInstances.find((fni) => fni.flowNodeId === selectedTokenFlowNodeId);

    setSelectedInstance(selectedInstance ?? flowNodeInstances[0]);
  }, []);

  return (
    <div className=" app-sdk-flex app-sdk-flex-col app-sdk-gap-4">
      <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-2 app-sdk-w-full">
        <label className="app-sdk-text-white">Select Flow Node:</label>
        <select
          className="app-sdk-text-white app-sdk-max-w-full app-sdk-bg-transparent app-sdk-border app-sdk-rounded-md app-sdk-py-2 app-sdk-px-1 app-sdk-text-ellipsis"
          onChange={(event) =>
            setSelectedInstance(flowNodeInstances.find((fni) => fni.flowNodeId === event.target.value)!)
          }
          value={selectedInstance?.flowNodeId ?? flowNodeInstances[0].flowNodeId}
        >
          {flowNodeInstances.map((instance) => (
            <option key={`token-viewer-option-${instance.flowNodeId}`} value={instance.flowNodeId}>
              {`${instance.flowNodeName ? `${instance.flowNodeName} (${instance.flowNodeId})` : instance.flowNodeId}`}
            </option>
          ))}
        </select>
      </div>
      <TokenViewer
        startToken={JSON.stringify(selectedInstance?.startToken ?? {}, null, 2)}
        endToken={JSON.stringify(selectedInstance?.endToken ?? {}, null, 2)}
      />
    </div>
  );
}
