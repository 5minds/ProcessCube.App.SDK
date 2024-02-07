import { Button, Divider, Link, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from '@nextui-org/react';
import { useState } from 'react';

import {
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    linkPlugin,
    linkDialogPlugin,
    tablePlugin,
    codeBlockPlugin,
    codeMirrorPlugin,
    MDXEditor,
    type MDXEditorMethods,
    type MDXEditorProps
} from '@mdxeditor/editor'

import Markdown from 'react-markdown';

import Editor from '@monaco-editor/react';
import { FlowNode } from "./bpmnViewerOverlayCreator";
import FlowNodeButtonArea from "./flowNodeButtonArea";
import FlowNodeColorArea from "./flowNodeColorArea";

type FlowNodeOverlayProps = {
    flowNode: FlowNode;
    width: number;
    height: number;
    retryAction: (processInstanceId: string, flowNodeInstanceId?: string, newToken?: any) => void;
}

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
        height: props.height + 10
    };


    return (
        <>
            <div style={style}>
                <FlowNodeColorArea onClick={flowNodeInfoModal.onOpen} {...props}></FlowNodeColorArea>
                <FlowNodeButtonArea onRetryClick={retryModal.onOpen} flowNode={props.flowNode}></FlowNodeButtonArea>
            </div>
            <Modal isOpen={retryModal.isOpen} onOpenChange={retryModal.onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Confirm Retry</ModalHeader>
                            <ModalBody>
                                <Divider className="my-2" />
                                <p>
                                    Are you sure you want to retry process instance {props.flowNode.CurrentFlowNodeInstanceId}?
                                </p>
                                <Divider className="my-2" />
                                <Editor
                                    className='monaco-editor'
                                    height="25vh"
                                    defaultLanguage="json"
                                    theme="vs-light"
                                    defaultValue={JSON.stringify(props.flowNode.CurrentStartToken)}
                                    onChange={(value, event) => setNewToken(value ?? '')}
                                    onMount={handleOnMount}
                                    options={{
                                        formatOnPaste: true,
                                        formatOnType: true,
                                        minimap: { enabled: false },
                                        lineNumbers: 'off'
                                    }} />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="warning" variant="light" onPress={onClose}>
                                    Close
                                </Button>
                                <Button color="primary" onPress={() => { props.retryAction(props.flowNode.ProcessInstanceId, props.flowNode.CurrentFlowNodeInstanceId, JSON.parse(newToken)); onClose() }}>
                                    Retry
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
            <Modal size="4xl"  isOpen={flowNodeInfoModal.isOpen} onOpenChange={flowNodeInfoModal.onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">FlowNode: {props.flowNode.Name ?? props.flowNode.Id}</ModalHeader>
                            <ModalBody>
                                <Divider className="my-2" />
                                <div className="flex-row">
                                    <div className='token-area'>
                                        <p>Start Token:</p>
                                        <Editor
                                            className='monaco-editor'
                                            height="25vh"
                                            defaultLanguage="json"
                                            theme="vs-light"
                                            defaultValue={JSON.stringify(props.flowNode.CurrentStartToken)}
                                            onMount={handleOnMount}
                                            options={{
                                                formatOnPaste: true,
                                                formatOnType: true,
                                                minimap: { enabled: false },
                                                lineNumbers: 'off',
                                            }} />
                                        <Divider className="my-2" />
                                        <p>End Token:</p>
                                        <Editor
                                            className='monaco-editor'
                                            height="25vh"
                                            defaultLanguage="json"
                                            theme="vs-light"
                                            defaultValue={JSON.stringify(props.flowNode.CurrentEndToken)}
                                            onMount={handleOnMount}
                                            options={{
                                                formatOnPaste: true,
                                                formatOnType: true,
                                                minimap: { enabled: false },
                                                lineNumbers: 'off'
                                            }} />
                                    </div>
                                    <div>
                                        <p>Dokumentation:</p>
                                        <Markdown>
                                            {props.flowNode.Documentation}
                                        </Markdown>
                                    </div>
                                </div>
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