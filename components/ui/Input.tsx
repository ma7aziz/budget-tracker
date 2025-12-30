import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--muted)] mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 border rounded-xl text-base
            bg-[var(--surface)] text-[var(--ink)]
            focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent
            disabled:bg-[var(--surface-strong)] disabled:cursor-not-allowed
            placeholder:text-[var(--muted)]
            transition-colors
            ${error ? "border-[var(--danger)]" : "border-[var(--border)]"}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-[var(--danger)]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-[var(--muted)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
