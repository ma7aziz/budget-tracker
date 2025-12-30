import { ButtonHTMLAttributes } from "react";

export interface FloatingActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
}

export function FloatingActionButton({ icon, className = "", ...props }: FloatingActionButtonProps) {
  return (
    <button
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        bg-primary-600 text-white
        shadow-lg hover:shadow-xl
        hover:bg-primary-700
        active:scale-95
        transition-all duration-200
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${className}
      `}
      {...props}
    >
      {icon}
    </button>
  );
}
