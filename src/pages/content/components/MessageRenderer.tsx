import React from 'react';
import Markdown from 'markdown-to-jsx';

interface MessageRendererProps {
  content: string;
  className?: string;
}

// Custom components for markdown-to-jsx with Hana theme styling
const MarkdownComponents = {
  // Style headings with Hana theme
  h1: ({ children, ...props }: any) => (
    <h3 className="text-base font-semibold text-[var(--hana-text-color)] mt-4 mb-2 first:mt-0" {...props}>
      {children}
    </h3>
  ),
  h2: ({ children, ...props }: any) => (
    <h4 className="text-sm font-semibold text-[var(--hana-text-color)] mt-3 mb-2 first:mt-0" {...props}>
      {children}
    </h4>
  ),
  h3: ({ children, ...props }: any) => (
    <h5 className="text-sm font-medium text-[var(--hana-text-color)] mt-3 mb-1 first:mt-0" {...props}>
      {children}
    </h5>
  ),
  h4: ({ children, ...props }: any) => (
    <h6 className="text-sm font-medium text-[var(--hana-text-color)] opacity-80 mt-2 mb-1 first:mt-0" {...props}>
      {children}
    </h6>
  ),
  h5: ({ children, ...props }: any) => (
    <h6 className="text-sm text-[var(--hana-text-color)] opacity-80 mt-2 mb-1 first:mt-0" {...props}>
      {children}
    </h6>
  ),
  h6: ({ children, ...props }: any) => (
    <span className="text-sm text-[var(--hana-text-color)] opacity-70 font-medium" {...props}>
      {children}
    </span>
  ),
  
  // Clean list styling with Hana theme
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside space-y-1 ml-2 my-2 text-[var(--hana-text-color)]" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-inside space-y-1 ml-2 my-2 text-[var(--hana-text-color)]" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-base leading-relaxed text-[var(--hana-text-color)]" {...props}>
      {children}
    </li>
  ),
  
  // Paragraphs with Hana theme
  p: ({ children, ...props }: any) => (
    <p className="text-base leading-relaxed mb-2 last:mb-0 text-[var(--hana-text-color)]" {...props}>
      {children}
    </p>
  ),
  
  // Enhanced inline and block code with potential LaTeX support
  code: ({ children, className, ...props }: any) => {
    const isInline = !className;
    const language = className?.replace('lang-', '') || '';
    
    if (isInline) {
      // Handle inline math notation (basic support without temml for now)
      const content = String(children);
      if (content.match(/^\$.*\$$/)) {
        const mathContent = content.slice(1, -1);
        // For now, just style it as math without rendering
        return (
          <span className="inline-flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-sm border border-blue-200 dark:border-blue-700 mx-0.5 font-mono">
            {mathContent}
          </span>
        );
      }
      
      return (
        <code className="bg-black/5 dark:bg-white/10 text-[var(--hana-text-color)] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }
    
    // Handle LaTeX code blocks (basic support without temml for now)
    if (language === 'latex') {
      return (
        <div className="my-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-700 overflow-x-auto">
          <div className="text-center">
            <div className="inline-block bg-white dark:bg-gray-800 px-4 py-3 rounded border border-blue-300 dark:border-blue-600 shadow-sm">
              <code className="text-sm font-mono text-[var(--hana-text-color)]">{children}</code>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <pre className="bg-black/5 dark:bg-white/10 p-3 rounded-lg my-2 overflow-x-auto">
        <code className="text-sm font-mono text-[var(--hana-text-color)]" {...props}>
          {children}
        </code>
      </pre>
    );
  },
  
  // Blockquotes with Hana theme
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-3 border-[var(--hana-accent-color)] pl-3 my-2 italic text-[var(--hana-text-color)] opacity-60" {...props}>
      {children}
    </blockquote>
  ),
  
  // Links with Hana theme colors
  a: ({ href, children, ...props }: any) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-[var(--hana-accent-color)] hover:opacity-80 underline decoration-1 underline-offset-2 transition-opacity"
      {...props}
    >
      {children}
    </a>
  ),

  // Tables with dynamic sizing and Hana theme
  table: ({ children, ...props }: any) => (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full bg-transparent border-collapse border border-gray-300 dark:border-gray-600 rounded-lg" {...props}>
        {children}
      </table>
    </div>
  ),
  
  thead: ({ children, ...props }: any) => (
    <thead className="bg-black/5 dark:bg-white/10" {...props}>
      {children}
    </thead>
  ),
  
  tbody: ({ children, ...props }: any) => (
    <tbody {...props}>
      {children}
    </tbody>
  ),
  
  tr: ({ children, ...props }: any) => (
    <tr {...props}>
      {children}
    </tr>
  ),
  
  th: ({ children, ...props }: any) => (
    <th 
      className="text-left text-sm font-semibold text-[var(--hana-text-color)] max-w-xs break-words" 
      {...props}
      style={{ 
        minWidth: '100px',
        maxWidth: '300px',
        width: 'auto',
        border: '1px solid rgba(128,128,128,0.3)',
        padding: '8px 12px'
      }}
    >
      <div className="whitespace-pre-wrap">
        {children}
      </div>
    </th>
  ),
  
  td: ({ children, ...props }: any) => (
    <td 
      className="text-sm text-[var(--hana-text-color)] opacity-80 max-w-xs break-words align-top" 
      {...props}
      style={{ 
        minWidth: '100px',
        maxWidth: '300px',
        width: 'auto',
        border: '1px solid rgba(128,128,128,0.3)',
        padding: '8px 12px'
      }}
    >
      <div className="whitespace-pre-wrap leading-relaxed">
        {children}
      </div>
    </td>
  ),

  // Strong and emphasis with Hana theme
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold text-[var(--hana-text-color)]" {...props}>
      {children}
    </strong>
  ),
  
  em: ({ children, ...props }: any) => (
    <em className="italic text-[var(--hana-text-color)]" {...props}>
      {children}
    </em>
  ),

  // Horizontal rule with Hana theme
  hr: ({ ...props }: any) => (
    <hr className="my-4 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" {...props} />
  ),
};

export const MessageRenderer: React.FC<MessageRendererProps> = React.memo(({ 
  content, 
  className = '' 
}) => {
  // Process content to handle special transformations
  const processedContent = React.useMemo(() => {
    let processed = content;
    
    // Handle quote tags (convert to markdown blockquotes)
    processed = processed.replace(/<quote>(.*?)<\/quote>/g, '> $1');
    
    return processed;
  }, [content]);

  return (
    <div className={`markdown-content ${className}`}>
      <Markdown options={{ overrides: MarkdownComponents }}>
        {processedContent}
      </Markdown>
    </div>
  );
});

export default MessageRenderer; 