import React, { type ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'vivox-button-primary',
      secondary: 'vivox-button-secondary',
      outline: 'vivox-button-secondary bg-transparent border-slate-300',
      danger: 'vivox-button-primary bg-red-600 border-red-700 hover:bg-red-700',
      ghost: 'vivox-button-secondary bg-transparent border-transparent shadow-none',
    };

    const sizes = {
      sm: 'min-height-[32px] px-3 text-xs',
      md: '', // vivox buttons define default sizing
      lg: 'min-height-[48px] px-6 text-sm',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
