import { ButtonHTMLAttributes } from "react";

export interface FloatingActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
}

export function FloatingActionButton({ icon, className = "", ...props }: FloatingActionButtonProps) {
  return (
    <button
      className={`
        fixed bottom-20 right-6 z-50 md:bottom-6
        w-14 h-14 rounded-full
        bg-[var(--accent)] text-[var(--accent-contrast)]
        shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow)]
        hover:bg-[var(--accent-strong)]
        active:scale-90
        transition-all duration-200
        flex items-center justify-center
        focus:outline-none focus:ring-4 focus:ring-[var(--accent)] focus:ring-opacity-30
        touch-manipulation
        ${className}
      `}
      {...props}
    >
      {icon}
    </button>
  );
}
