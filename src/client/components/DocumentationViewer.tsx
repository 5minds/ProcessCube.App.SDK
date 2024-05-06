import React from 'react';
import Markdown from 'react-markdown';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

function DocumentationViewerFunction(props: { documentation: string }) {
  return (
    <div className="markdown-container">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]]}
        className="markdown"
      >
        {props.documentation ?? ''}
      </Markdown>
    </div>
  );
}

export const DocumentationViewer = DocumentationViewerFunction;
