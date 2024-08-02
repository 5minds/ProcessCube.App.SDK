import React, { useEffect, useState } from 'react';

import { FlowNodeInstance } from '@5minds/processcube_engine_sdk';

import { TokenInspector } from './TokenInspector';

export function FlowNodeTokenInspector({ flowNodeInstances }: { flowNodeInstances: FlowNodeInstance[] }) {
  const [selectedInstance, setSelectedInstance] = useState<FlowNodeInstance>();

  useEffect(() => {
    if (!selectedInstance) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    if (selectedInstance.flowNodeId === flowNodeInstances[0].flowNodeId) {
      searchParams.delete('tokenInspectorId');
    } else {
      searchParams.set('tokenInspectorId', selectedInstance.flowNodeId);
    }

    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`,
    );
  }, [selectedInstance]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const selectedTokenFlowNodeId = searchParams.get('tokenInspectorId');
    const selectedInstance = flowNodeInstances.find((fni) => fni.flowNodeId === selectedTokenFlowNodeId);

    if (selectedInstance?.flowNodeId === flowNodeInstances[0].flowNodeId) {
      return;
    }

    setSelectedInstance(selectedInstance ?? flowNodeInstances[0]);
  }, [flowNodeInstances]);

  return (
    <div className=" app-sdk-flex app-sdk-flex-col app-sdk-gap-4">
      {flowNodeInstances.length === 1 ? (
        <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1 app-sdk-w-full">
          <label className="app-sdk-text-white">Flow Node:</label>
          <span className="app-sdk-text-white">
            {`${flowNodeInstances[0].flowNodeName ? `${flowNodeInstances[0].flowNodeName} (${flowNodeInstances[0].flowNodeId})` : flowNodeInstances[0].flowNodeId}`}
          </span>
        </div>
      ) : (
        <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1 app-sdk-w-full">
          <label className="app-sdk-text-white">Select Flow Node:</label>
          <select
            className="app-sdk-text-white app-sdk-max-w-full app-sdk-bg-transparent app-sdk-border app-sdk-rounded-md app-sdk-py-2 app-sdk-px-1 app-sdk-text-ellipsis"
            onChange={(event) =>
              setSelectedInstance(flowNodeInstances.find((fni) => fni.flowNodeId === event.target.value)!)
            }
            value={selectedInstance?.flowNodeId ?? flowNodeInstances[0].flowNodeId}
          >
            {flowNodeInstances.map((instance) => (
              <option key={`token-inspector-option-${instance.flowNodeId}`} value={instance.flowNodeId}>
                {`${instance.flowNodeName ? `${instance.flowNodeName} (${instance.flowNodeId})` : instance.flowNodeId}`}
              </option>
            ))}
          </select>
        </div>
      )}
      <TokenInspector
        startToken={JSON.stringify(selectedInstance?.startToken ?? flowNodeInstances[0].startToken, null, 2)}
        endToken={JSON.stringify(selectedInstance?.endToken ?? flowNodeInstances[0].endToken, null, 2)}
      />
    </div>
  );
}
