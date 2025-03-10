import { Editor } from '@monaco-editor/react';
import React, { useEffect, useMemo, useState } from 'react';

import { FlowNodeInstance, ProcessInstance } from '@5minds/processcube_engine_sdk';

import {
  calculateTimeBetweenTimestamps,
  getAverage,
  getLongestLeadTime,
  getShortestLeadTime,
} from '../../utils/calculations';

type TokenInspectorProps = {
  processInstance: ProcessInstance;
  flowNodeInstances: FlowNodeInstance[];
  leadTimes: number[];
  isInstanceRunning: boolean;
};

export function TokenInspector({
  processInstance,
  flowNodeInstances,
  leadTimes,
  isInstanceRunning,
}: TokenInspectorProps) {
  const [selectedInstance, setSelectedInstance] = useState<FlowNodeInstance>();
  const [initialRender, setInitialRender] = useState(true);

  useEffect(() => {
    if (initialRender && flowNodeInstances.length > 1) {
      setInitialRender(false);
    }

    return () => {
      if (initialRender) {
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete('tokenInspectorFocus');
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`,
      );
    };
  }, [initialRender, flowNodeInstances]);

  useEffect(() => {
    if (initialRender && flowNodeInstances.length > 1) {
      setInitialRender(false);
    }

    return () => {
      if (initialRender) {
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete('tokenInspectorFocus');
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`,
      );
    };
  }, [initialRender, flowNodeInstances]);

  useEffect(() => {
    if (flowNodeInstances.length < 2) {
      setSelectedInstance(undefined);
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    const tokenInspectorFocus = searchParams.get('tokenInspectorFocus');
    if (!tokenInspectorFocus) {
      setSelectedInstance(flowNodeInstances[0]);
    }

    const instance = flowNodeInstances.find((fni) => fni.flowNodeId === tokenInspectorFocus);
    if (!instance) {
      return;
    }

    setSelectedInstance(instance);
  }, [flowNodeInstances]);

  useEffect(() => {
    if (initialRender) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    if (!selectedInstance) {
      searchParams.delete('tokenInspectorFocus');
    } else {
      searchParams.set('tokenInspectorFocus', selectedInstance.flowNodeId);
    }

    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`,
    );
  }, [selectedInstance, initialRender]);

  const startToken = useMemo(() => {
    if (flowNodeInstances.length === 1) {
      return JSON.stringify(flowNodeInstances[0].startToken, null, 2);
    } else if (selectedInstance) {
      return JSON.stringify(selectedInstance.startToken, null, 2);
    }

    return JSON.stringify(processInstance?.startToken ?? {}, null, 2);
  }, [selectedInstance, flowNodeInstances, processInstance]);

  const endToken = useMemo(() => {
    if (flowNodeInstances.length === 1) {
      return JSON.stringify(flowNodeInstances[0].endToken, null, 2);
    } else if (selectedInstance) {
      return JSON.stringify(selectedInstance.endToken, null, 2);
    }

    return JSON.stringify(processInstance?.endToken ?? {}, null, 2);
  }, [selectedInstance, flowNodeInstances, processInstance]);

  const currentLeadTime = useMemo(() => {
    if (flowNodeInstances.length === 1 && flowNodeInstances[0].startedAt && flowNodeInstances[0].finishedAt) {
      const time = calculateTimeBetweenTimestamps([flowNodeInstances[0].startedAt, flowNodeInstances[0].finishedAt]);
      return time[0];
    } else if (selectedInstance && selectedInstance.startedAt && selectedInstance.finishedAt) {
      console.log(selectedInstance);
      const time = calculateTimeBetweenTimestamps([selectedInstance.startedAt, selectedInstance.finishedAt]);
      return time[0];
    }

    return leadTimes[0];
  }, [selectedInstance, flowNodeInstances]);

  const averageLeadTime = useMemo(() => {
    if (flowNodeInstances.length === 1 && flowNodeInstances[0].startedAt && flowNodeInstances[0].finishedAt) {
      const time = calculateTimeBetweenTimestamps([flowNodeInstances[0].startedAt, flowNodeInstances[0].finishedAt]);
      return 1;
    } else if (selectedInstance && selectedInstance.startedAt && selectedInstance.finishedAt) {
      const time = calculateTimeBetweenTimestamps([selectedInstance.startedAt, selectedInstance.finishedAt]);
      return 0;
    }

    return getAverage(leadTimes);
  }, [selectedInstance, flowNodeInstances]);

  const shortestLeadTime = useMemo(() => {
    if (flowNodeInstances.length === 1 && flowNodeInstances[0].startedAt && flowNodeInstances[0].finishedAt) {
      const time = calculateTimeBetweenTimestamps([flowNodeInstances[0].startedAt, flowNodeInstances[0].finishedAt]);
      return 0;
    } else if (selectedInstance && selectedInstance.startedAt && selectedInstance.finishedAt) {
      const time = calculateTimeBetweenTimestamps([selectedInstance.startedAt, selectedInstance.finishedAt]);
      return 1;
    }

    return getShortestLeadTime(leadTimes);
  }, [selectedInstance, flowNodeInstances]);

  const longestLeadTime = useMemo(() => {
    if (flowNodeInstances.length === 1 && flowNodeInstances[0].startedAt && flowNodeInstances[0].finishedAt) {
      const time = calculateTimeBetweenTimestamps([flowNodeInstances[0].startedAt, flowNodeInstances[0].finishedAt]);
      return 1;
    } else if (selectedInstance && selectedInstance.startedAt && selectedInstance.finishedAt) {
      const time = calculateTimeBetweenTimestamps([selectedInstance.startedAt, selectedInstance.finishedAt]);
      return 0;
    }

    return getLongestLeadTime(leadTimes);
  }, [selectedInstance, flowNodeInstances]);

  return (
    <div className="app-sdk-flex app-sdk-flex-col app-sdk-h-full app-sdk-rounded-3xl app-sdk-p-4 app-sdk-gap-1 app-sdk-bg-white/95 dark:app-sdk-bg-black/85 dark:app-sdk-text-white app-sdk-border app-sdk-border-solid dark:app-sdk-border-none">
      <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-4">
        {flowNodeInstances.length === 0 ? (
          <label className="app-sdk-break-all">
            Process: {processInstance.processModelId}
            {processInstance.processModelName && ` (${processInstance.processModelName})`}
          </label>
        ) : flowNodeInstances.length === 1 ? (
          <label className="app-sdk-break-all">
            Flow Node: {flowNodeInstances[0].flowNodeId}
            {flowNodeInstances[0].flowNodeName && ` (${flowNodeInstances[0].flowNodeName})`}
          </label>
        ) : (
          <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1 app-sdk-w-full">
            <label>Select Flow Node:</label>
            <select
              className="app-sdk-max-w-full app-sdk-bg-transparent app-sdk-border app-sdk-rounded-md app-sdk-py-2 app-sdk-px-1 app-sdk-text-ellipsis"
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
        <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-3">
          <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1">
            <label>Start Token</label>
            <Editor
              height="7rem"
              defaultLanguage="json"
              value={startToken}
              options={{ lineNumbersMinChars: 2, readOnly: true, minimap: { enabled: false } }}
            />
          </div>
          <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1">
            <label>End Token</label>
            <Editor
              height="7rem"
              defaultLanguage="json"
              value={endToken}
              options={{ lineNumbersMinChars: 2, readOnly: true, minimap: { enabled: false } }}
            />
          </div>
          {!isInstanceRunning && (
            <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1">
              <div>Laufzeit: {formatDuration(currentLeadTime)}</div>
              <div>Durchschnittliche Laufzeit: {formatDuration(averageLeadTime)}</div>
              <div>Kürzeste Laufzeit: {formatDuration(shortestLeadTime)}</div>
              <div>Längste Laufzeit: {formatDuration(longestLeadTime)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);
  const milliseconds = ms % 1000;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}min`);
  if (seconds > 0) parts.push(`${seconds}s`);
  if (milliseconds > 0) parts.push(`${milliseconds}ms`);

  return parts.length > 0 ? parts.join(' ') : '0ms';
}
