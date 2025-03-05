import { ArrowsPointingInIcon, ArrowsPointingOutIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Editor } from '@monaco-editor/react';
import React, { useEffect, useMemo, useState } from 'react';

import { FlowNodeInstance, ProcessInstance } from '@5minds/processcube_engine_sdk';

type TokenInspectorProps = {
  processInstance: ProcessInstance;
  flowNodeInstances: FlowNodeInstance[];
  close: () => void;
};

export function TokenInspector(props: TokenInspectorProps) {
  const [selectedInstance, setSelectedInstance] = useState<FlowNodeInstance>();
  const [initialRender, setInitialRender] = useState(true);
  const [fullscreenToken, setFullscreenToken] = useState<'start' | 'end' | null>(null);

  const toggleFullscreen = (token: 'start' | 'end') => {
    setFullscreenToken(fullscreenToken === token ? null : token);
  };

  useEffect(() => {
    if (initialRender && props.flowNodeInstances.length > 1) {
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
  }, [initialRender, props.flowNodeInstances]);

  useEffect(() => {
    if (props.flowNodeInstances.length < 2) {
      setSelectedInstance(undefined);
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    const tokenInspectorFocus = searchParams.get('tokenInspectorFocus');
    if (!tokenInspectorFocus) {
      setSelectedInstance(props.flowNodeInstances[0]);
    }

    const instance = props.flowNodeInstances.find((fni) => fni.flowNodeId === tokenInspectorFocus);
    if (!instance) {
      return;
    }

    setSelectedInstance(instance);
  }, [props.flowNodeInstances]);

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
    if (props.flowNodeInstances.length === 1) {
      return JSON.stringify(props.flowNodeInstances[0].startToken, null, 2);
    } else if (selectedInstance) {
      return JSON.stringify(selectedInstance.startToken, null, 2);
    }

    return JSON.stringify(props.processInstance?.startToken ?? {}, null, 2);
  }, [selectedInstance, props.flowNodeInstances, props.processInstance]);

  const endToken = useMemo(() => {
    if (props.flowNodeInstances.length === 1) {
      return JSON.stringify(props.flowNodeInstances[0].endToken, null, 2);
    } else if (selectedInstance) {
      return JSON.stringify(selectedInstance.endToken, null, 2);
    }

    return JSON.stringify(props.processInstance?.endToken ?? {}, null, 2);
  }, [selectedInstance, props.flowNodeInstances, props.processInstance]);

  return (
    <div className="app-sdk-flex app-sdk-flex-col app-sdk-h-full app-sdk-rounded-3xl app-sdk-p-4 app-sdk-gap-1 app-sdk-bg-white/95 dark:app-sdk-bg-black/85 dark:app-sdk-text-white app-sdk-border app-sdk-border-solid dark:app-sdk-border-none">
      <button
        onClick={() => {
          props.close();
        }}
        className="app-sdk-text-white hover:app-sdk-text-gray-300"
        title="Close Token Inspector"
      >
        <XMarkIcon className="app-sdk-w-6 app-sdk-h-6" />
      </button>
      <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-4">
        {props.flowNodeInstances.length === 0 ? (
          <label className="app-sdk-break-all">
            Process: {props.processInstance.processModelId}
            {props.processInstance.processModelName && ` (${props.processInstance.processModelName})`}
          </label>
        ) : props.flowNodeInstances.length === 1 ? (
          <label className="app-sdk-break-all">
            Flow Node: {props.flowNodeInstances[0].flowNodeId}
            {props.flowNodeInstances[0].flowNodeName && ` (${props.flowNodeInstances[0].flowNodeName})`}
          </label>
        ) : (
          <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1 app-sdk-w-full">
            <label>Select Flow Node:</label>
            <select
              className="app-sdk-max-w-full app-sdk-bg-transparent app-sdk-border app-sdk-rounded-md app-sdk-py-2 app-sdk-px-1 app-sdk-text-ellipsis"
              onChange={(event) =>
                setSelectedInstance(props.flowNodeInstances.find((fni) => fni.flowNodeId === event.target.value)!)
              }
              value={selectedInstance?.flowNodeId ?? props.flowNodeInstances[0].flowNodeId}
            >
              {props.flowNodeInstances.map((instance) => (
                <option key={`token-inspector-option-${instance.flowNodeId}`} value={instance.flowNodeId}>
                  {`${instance.flowNodeName ? `${instance.flowNodeName} (${instance.flowNodeId})` : instance.flowNodeId}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-3">
          {fullscreenToken && (
            <div className="app-sdk-fixed app-sdk-inset-0 app-sdk-bg-black/30 app-sdk-backdrop-blur-md app-sdk-z-40"></div>
          )}

          <div
            className={`app-sdk-flex app-sdk-flex-col app-sdk-gap-1
      ${
        fullscreenToken === 'start'
          ? 'app-sdk-fixed app-sdk-top-1/2 app-sdk-left-1/2 app-sdk--translate-x-1/2 app-sdk--translate-y-1/2 app-sdk-w-4/5 app-sdk-h-[70vh] app-sdk-bg-white/10 app-sdk-backdrop-blur-xl app-sdk-rounded-xl app-sdk-shadow-2xl app-sdk-z-50 app-sdk-p-6'
          : ''
      }`}
          >
            <div className="app-sdk-flex app-sdk-items-center app-sdk-justify-between">
              <label className="app-sdk-text-white app-sdk-font-medium">Start Token</label>
              <button
                className="app-sdk-text-white hover:app-sdk-text-gray-300 app-sdk-w-6 app-sdk-h-6"
                onClick={() => toggleFullscreen('start')}
                title={fullscreenToken === 'start' ? 'Minimize' : 'Maximize'}
              >
                {fullscreenToken === 'start' ? (
                  <ArrowsPointingInIcon className="app-sdk-w-6 app-sdk-h-6" />
                ) : (
                  <ArrowsPointingOutIcon className="app-sdk-w-6 app-sdk-h-6" />
                )}
              </button>
            </div>
            <Editor
              height={fullscreenToken === 'start' ? '60vh' : '7rem'}
              defaultLanguage="json"
              value={startToken}
              options={{ lineNumbersMinChars: 2, readOnly: true, minimap: { enabled: false } }}
            />
          </div>

          <div
            className={`app-sdk-flex app-sdk-flex-col app-sdk-gap-1
      ${
        fullscreenToken === 'end'
          ? 'app-sdk-fixed app-sdk-top-1/2 app-sdk-left-1/2 app-sdk--translate-x-1/2 app-sdk--translate-y-1/2 app-sdk-w-4/5 app-sdk-h-[70vh] app-sdk-bg-white/10 app-sdk-backdrop-blur-xl app-sdk-rounded-xl app-sdk-shadow-2xl app-sdk-z-50 app-sdk-p-6'
          : ''
      }`}
          >
            <div className="app-sdk-flex app-sdk-items-center app-sdk-justify-between">
              <label className="app-sdk-text-white app-sdk-font-medium">End Token</label>
              <button
                className="app-sdk-text-white hover:app-sdk-text-gray-300 app-sdk-w-6 app-sdk-h-6"
                onClick={() => toggleFullscreen('end')}
                title={fullscreenToken === 'end' ? 'Minimize' : 'Maximize'}
              >
                {fullscreenToken === 'end' ? (
                  <ArrowsPointingInIcon className="app-sdk-w-6 app-sdk-h-6" />
                ) : (
                  <ArrowsPointingOutIcon className="app-sdk-w-6 app-sdk-h-6" />
                )}
              </button>
            </div>
            <Editor
              height={fullscreenToken === 'end' ? '60vh' : '7rem'}
              defaultLanguage="json"
              value={endToken}
              options={{ lineNumbersMinChars: 2, readOnly: true, minimap: { enabled: false } }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
