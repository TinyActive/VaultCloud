import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    containerClassName?: string;
    // FIX: Add icon prop to support icons within the input.
    icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, id, containerClassName, icon, ...props }, ref) => {
    const baseClasses = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
    
    return (
        <div className={containerClassName}>
            {label && <label htmlFor={id} className="block text-sm font-medium text-foreground mb-2">{label}</label>}
            {/* FIX: Wrap input to position the icon absolutely. */}
            <div className="relative flex items-center">
              {icon && <span className="absolute left-3 pointer-events-none">{icon}</span>}
              <input
                  type={type}
                  id={id}
                  className={`${baseClasses} ${icon ? 'pl-10' : ''} ${className}`}
                  ref={ref}
                  {...props}
              />
            </div>
        </div>
    );
  }
);
Input.displayName = 'Input';

export default Input;