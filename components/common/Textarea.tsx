import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 text-left">
        {label}
      </label>
      <textarea
        id={id}
        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
        {...props}
      />
    </div>
  );
};

export default Textarea;