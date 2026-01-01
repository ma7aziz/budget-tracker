import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth = false, className = "", disabled, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg)] border disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation";
    
    const variantStyles = {
      primary:
        "bg-[var(--accent)] border-transparent text-[var(--accent-contrast)] hover:bg-[var(--accent-strong)] focus:ring-[var(--accent)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow)]",
      secondary:
        "bg-[var(--surface)] border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface-strong)] focus:ring-[var(--accent)]",
      danger:
        "bg-[var(--danger)] border-transparent text-[var(--danger-contrast)] hover:brightness-95 focus:ring-[var(--danger)] shadow-[var(--shadow-soft)]",
      ghost:
        "bg-transparent border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] focus:ring-[var(--accent)]",
    };
    
    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };
    
    const widthStyle = fullWidth ? "w-full" : "";
    
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
