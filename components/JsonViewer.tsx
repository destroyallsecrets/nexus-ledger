import React from 'react';

interface JsonViewerProps {
  data: any;
  title?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, title }) => {
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="bg-nexus-900 rounded-lg border border-nexus-700 overflow-hidden shadow-inner">
      {title && (
        <div className="bg-nexus-800 px-4 py-2 border-b border-nexus-700 text-xs font-mono text-nexus-accent uppercase tracking-wider flex justify-between items-center">
          <span>{title}</span>
          <span className="text-gray-500">JSON</span>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono leading-relaxed">
        <code className="language-json text-gray-300">
          {jsonString.split('\n').map((line, i) => (
            <div key={i} className="hover:bg-nexus-800/30 px-1 rounded-sm">
              {line}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};