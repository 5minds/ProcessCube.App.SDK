'use client';

import { Divider } from '@heroui/react';
import Editor from '@monaco-editor/react';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { warnOnceForDeprecation } from '../../utils/warnOnceForDeprecation';
import { FlowNode } from './bpmnViewerOverlayCreator';

type FlowNodeInfoComponentProps = {
  flowNode: FlowNode;
};

/**
 * @deprecated
 */
export default function FlowNodeInfoComponent(props: FlowNodeInfoComponentProps) {
  warnOnceForDeprecation('FlowNodeInfoComponent');
  function handleOnMount(editor: any) {
    setTimeout(() => {
      editor.getAction('editor.action.formatDocument').run();
      editor.updateOptions({ readOnly: true });
    }, 300);
  }

  useEffect(() => {
    const markdownEditor = <Markdown remarkPlugins={[remarkGfm]}>{props.flowNode.Documentation}</Markdown>;

    const markdownContainer = document.getElementById('markdown-container');

    if (markdownContainer) {
      const shadowRoot = markdownContainer.attachShadow({ mode: 'open' });
      const root = createRoot(shadowRoot);
      root.render(markdownEditor);
    }
  }, []);

  return (
    <>
      <Divider className="my-2" />
      <div className="flex-row">
        <div className="token-area">
          <p>Start Token:</p>
          <Editor
            className="monaco-editor"
            height="25vh"
            defaultLanguage="json"
            theme="vs-light"
            defaultValue={JSON.stringify(props.flowNode.CurrentStartToken, null, 2)}
            onMount={handleOnMount}
            options={{
              formatOnPaste: true,
              formatOnType: true,
              minimap: { enabled: false },
              lineNumbers: 'off',
            }}
          />
          <Divider className="my-2" />
          <p>End Token:</p>
          <Editor
            className="monaco-editor"
            height="25vh"
            defaultLanguage="json"
            theme="vs-light"
            defaultValue={JSON.stringify(props.flowNode.CurrentEndToken, null, 2)}
            onMount={handleOnMount}
            options={{
              formatOnPaste: true,
              formatOnType: true,
              minimap: { enabled: false },
              lineNumbers: 'off',
            }}
          />
        </div>
        <div className="documentation-area">
          <p>Dokumentation:</p>
          <div id="markdown-container"></div>
        </div>
      </div>
    </>
  );
}
