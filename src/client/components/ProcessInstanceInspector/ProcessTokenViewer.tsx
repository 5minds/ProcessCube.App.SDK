import Editor from '@monaco-editor/react';
import React from 'react';

export function ProcessTokenViewer({ startToken, endToken }: { startToken: any; endToken: any }) {
  return (
    <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-3 app-sdk-p-2">
      <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1">
        <label className="app-sdk-text-white">Start Token</label>
        <Editor
          height="7rem"
          defaultLanguage="json"
          defaultValue={JSON.stringify(startToken ?? {}, null, 2)}
          theme="vs-dark"
          options={{ lineNumbersMinChars: 2, readOnly: true }}
        />
      </div>
      <div className="app-sdk-flex app-sdk-flex-col app-sdk-gap-1">
        <label className="app-sdk-text-white">End Token</label>
        <Editor
          height="7rem"
          defaultLanguage="json"
          defaultValue={JSON.stringify(endToken ?? {}, null, 2)}
          theme="vs-dark"
          options={{ lineNumbersMinChars: 2, readOnly: true }}
        />
      </div>
    </div>
  );
}
