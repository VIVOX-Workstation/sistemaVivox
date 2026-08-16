import React, { type SelectHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-[#625746]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'vivox-field disabled:cursor-not-allowed disabled:opacity-50 text-xs bg-[#FFFDF8]',
            error && 'border-red-500',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
