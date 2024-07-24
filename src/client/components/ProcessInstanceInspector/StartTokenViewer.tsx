import Editor from '@monaco-editor/react';
import React from 'react';

export function StartTokenViewer({ startToken }: { startToken: any }) {
  return (
    <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1 app-sdk-p-2">
      <label className="app-sdk-text-white">Start Token</label>
      <Editor
        height="7rem"
        defaultLanguage="json"
        defaultValue={JSON.stringify(startToken ?? {}, null, 2)}
        theme="vs-dark"
        options={{ lineNumbersMinChars: 2, readOnly: true }}
      />
    </div>
  );
}
