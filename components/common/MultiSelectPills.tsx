import React from 'react';

interface MultiSelectPillsProps {
  options: string[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

const MultiSelectPills: React.FC<MultiSelectPillsProps> = ({ options, selectedOptions, onChange, className }) => {

  const handleToggle = (option: string) => {
    const newSelected = selectedOptions.includes(option)
      ? selectedOptions.filter(item => item !== option)
      : [...selectedOptions, option];
    onChange(newSelected);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className || ''}`}>
      {options.map(option => {
        const isSelected = selectedOptions.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => handleToggle(option)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors
              ${isSelected 
                ? 'bg-brand-primary text-white border-brand-primary' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }
            `}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};

export default MultiSelectPills;
