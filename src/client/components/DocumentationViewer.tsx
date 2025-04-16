import React from 'react';
import Markdown from 'react-markdown';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

export function DocumentationViewer(props: { documentation: string }) {
  return (
    <div className="app-sdk-absolute app-sdk-w-full app-sdk-h-full app-sdk-overflow-y-auto app-sdk-scroll-p-4 app-sdk-scroll-smooth app-sdk-scroll-shadow">
      <div className="app-sdk-markdown lg:app-sdk-mx-40 md:app-sdk-mx-20 app-sdk-mx-10">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]]}
      >
        {props.documentation ?? ''}
      </Markdown>
      </div>
    </div>
  );
}
