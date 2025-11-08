
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', fullWidth = false, className, ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'text-white bg-brand-primary hover:bg-brand-dark focus:ring-brand-primary',
    secondary: 'text-brand-primary bg-brand-light hover:bg-indigo-200 focus:ring-brand-primary',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const widthStyle = fullWidth ? 'w-full' : '';

  const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className || ''}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
