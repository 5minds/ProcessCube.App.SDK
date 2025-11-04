import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import Editor from '@monaco-editor/react';
import React, { useEffect, useState } from 'react';

import { FlowNodeInstance, ProcessInstance } from '@5minds/processcube_engine_sdk';

export type RetryDialogProps = {
  isOpen: boolean;
  processInstance: ProcessInstance;
  flowNodeInstance?: FlowNodeInstance;
  onClose: () => void;
};

export function RetryDialog(props: RetryDialogProps) {
  const [startToken, setStartToken] = useState<string>('');

  useEffect(() => {
    setStartToken(
      JSON.stringify(props.flowNodeInstance?.startToken ?? props.processInstance.startToken ?? {}, null, 2),
    );
  }, [props.flowNodeInstance, props.processInstance]);

  return (
    <Dialog open={props.isOpen} onClose={props.onClose} className="app-sdk-relative app-sdk-z-50">
      <DialogBackdrop
        transition
        className="app-sdk-fixed app-sdk-inset-0 app-sdk-bg-gray-500 app-sdk-bg-opacity-25 app-sdk-transition-opacity data-[closed]:app-sdk-opacity-0 data-[enter]:app-sdk-duration-300 data-[leave]:app-sdk-duration-150 data-[enter]:app-sdk-ease-out data-[leave]:app-sdk-ease-in"
      >
        <div className="app-sdk-fixed app-sdk-inset-0 app-sdk-flex app-sdk-w-screen app-sdk-items-center app-sdk-justify-center app-sdk-p-4">
          <DialogPanel className="app-sdk-max-w-lg app-sdk-space-y-4 app-sdk-shadow-2xl app-sdk-bg-[color:var(--asdk-rd-background-color)] app-sdk-p-8 app-sdk-rounded-xl app-sdk-text-[color:var(--asdk-rd-text-color)]">
            <DialogTitle className="app-sdk-font-bold">Retry Process Instance</DialogTitle>
            <Description className="app-sdk-break-words">
              Are you sure you want to retry the Process Instance
              {props.flowNodeInstance && ` at this Flow Node (${props.flowNodeInstance.flowNodeId})`}?
            </Description>
            <Description>You can provide a new start token:</Description>
            <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1">
              <label>Start Token</label>
              <Editor
                height="7rem"
                defaultLanguage="json"
                defaultValue={startToken}
                onChange={(value) => setStartToken(value ?? '')}
                options={{
                  lineNumbersMinChars: 2,
                  readOnly: false,
                  minimap: { enabled: false },
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>
            <div className="app-sdk-flex app-sdk-justify-end app-sdk-gap-2">
              <button
                className="app-sdk-bg-[color:var(--asdk-rd-secondary-button-color)] app-sdk-text-[color:var(--asdk-rd-secondary-button-text-color)] app-sdk-rounded-md app-sdk-p-2 app-sdk-border hover:app-sdk-cursor-pointer hover:app-sdk-bg-[color:var(--asdk-rd-secondary-button-hover-color)]"
                onClick={props.onClose}
              >
                Cancel
              </button>
              <button
                className="app-sdk-bg-[color:var(--asdk-rd-primary-button-color)] app-sdk-text-[color:var(--asdk-rd-primary-button-text-color)] app-sdk-rounded-md app-sdk-p-2 app-sdk-border-0 hover:app-sdk-cursor-pointer hover:app-sdk-bg-[color:var(--asdk-rd-primary-button-hover-color)]"
                onClick={async () => {
                  const newStartToken = JSON.parse(startToken);
                  const serverActions = await import('../../../server/actions');

                  (await serverActions.retryProcess(
                    props.processInstance.processInstanceId,
                    props.flowNodeInstance?.flowNodeInstanceId,
                    newStartToken,
                  ),
                    props.onClose());
                }}
              >
                Retry
              </button>
            </div>
          </DialogPanel>
        </div>
      </DialogBackdrop>
    </Dialog>
  );
}
