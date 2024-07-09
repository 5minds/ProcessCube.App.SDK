import Editor from '@monaco-editor/react';
import {
  Button,
  Divider,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@nextui-org/react';
import React, { useState } from 'react';

import { FlowNode } from './bpmnViewerOverlayCreator';
import FlowNodeButtonArea from './flowNodeButtonArea';
import FlowNodeColorArea from './flowNodeColorArea';
import FlowNodeInfoComponent from './flowNodeInfoComponent';

type FlowNodeOverlayProps = {
  flowNode: FlowNode;
  width: number;
  height: number;
  retryAction?: (processInstanceId: string, flowNodeInstanceId?: string, newToken?: any) => void;
  gotoProcessAction?: (processInstanceId: string) => void;
  gotoManualOrUserTaskAction?: (processInstanceId: string, flowNodeId: string) => void;
};

export default function FlowNodeOverlay(props: FlowNodeOverlayProps) {
  const retryModal = useDisclosure();
  const flowNodeInfoModal = useDisclosure();
  const [newToken, setNewToken] = useState(JSON.stringify(props.flowNode.CurrentStartToken));

  function handleOnMount(editor: any) {
    setTimeout(() => {
      editor.getAction('editor.action.formatDocument').run();
    }, 300);
  }
  const style = {
    width: props.width,
    height: props.height + 10,
  };

  return (
    <>
      <div style={style}>
        <FlowNodeColorArea onClick={flowNodeInfoModal.onOpen} {...props}></FlowNodeColorArea>
        <FlowNodeButtonArea
          onRetryClick={props.retryAction ? retryModal.onOpen : undefined}
          onGotoClick={props.gotoProcessAction ? () => props.gotoProcessAction!(props.flowNode.LinkedProcessInstanceId ?? '') : undefined}
          onPlayClick={props.gotoManualOrUserTaskAction ? () => props.gotoManualOrUserTaskAction!(props.flowNode.ProcessInstanceId, props.flowNode.Id) : undefined}
          flowNode={props.flowNode}
        ></FlowNodeButtonArea>
      </div>
      <Modal isOpen={retryModal.isOpen} onOpenChange={retryModal.onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Confirm Retry</ModalHeader>
              <ModalBody>
                <Divider className="my-2" />
                <p>Are you sure you want to retry process instance {props.flowNode.CurrentFlowNodeInstanceId}?</p>
                <Divider className="my-2" />
                <Editor
                  className="monaco-editor"
                  height="25vh"
                  defaultLanguage="json"
                  theme="vs-light"
                  defaultValue={JSON.stringify(props.flowNode.CurrentStartToken, null, 2)}
                  onChange={(value, event) => setNewToken(value ?? '')}
                  onMount={handleOnMount}
                  options={{
                    formatOnPaste: true,
                    formatOnType: true,
                    minimap: { enabled: false },
                    lineNumbers: 'off',
                  }}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="warning" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    props.retryAction?.(
                      props.flowNode.ProcessInstanceId,
                      props.flowNode.CurrentFlowNodeInstanceId,
                      JSON.parse(newToken),
                    );
                    onClose();
                  }}
                >
                  Retry
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal size="4xl" isOpen={flowNodeInfoModal.isOpen} onOpenChange={flowNodeInfoModal.onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                FlowNode: {props.flowNode.Name ?? props.flowNode.Id}
              </ModalHeader>
              <ModalBody>
                <FlowNodeInfoComponent flowNode={props.flowNode}></FlowNodeInfoComponent>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
