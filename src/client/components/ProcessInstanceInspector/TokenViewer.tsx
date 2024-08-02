import Editor from '@monaco-editor/react';
import React from 'react';

type TokenViewerProps = {
  startToken: string;
  endToken: string;
};

export function TokenViewer({ startToken, endToken }: TokenViewerProps) {
  return (
    <div key={`${startToken}${endToken}`} className="app-sdk-flex app-sdk-flex-col app-sdk-gap-3">
      <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1">
        <label className="app-sdk-text-white">Start Token</label>
        <Editor
          height="7rem"
          defaultLanguage="json"
          defaultValue={startToken}
          theme="vs-dark"
          options={{ lineNumbersMinChars: 2, readOnly: true }}
        />
      </div>
      <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1">
        <label className="app-sdk-text-white">End Token</label>
        <Editor
          height="7rem"
          defaultLanguage="json"
          defaultValue={endToken}
          theme="vs-dark"
          options={{ lineNumbersMinChars: 2, readOnly: true }}
        />
      </div>
    </div>
  );
}
