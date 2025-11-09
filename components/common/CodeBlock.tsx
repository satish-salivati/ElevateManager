import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript' }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-slate-800 text-white p-4 rounded-md text-sm font-mono relative">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold py-1 px-2 rounded-md transition-colors"
      >
        {isCopied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="whitespace-pre-wrap overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
