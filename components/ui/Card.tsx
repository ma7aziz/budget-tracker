import { ReactNode, CSSProperties } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Card({ children, className = "", onClick, style }: CardProps) {
  const clickable = onClick
    ? "cursor-pointer hover:shadow-[var(--shadow)] active:scale-[0.98] transition-all"
    : "";
  
  return (
    <div
      onClick={onClick}
      style={style}
      className={`bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-soft)] p-4 transition-colors ${clickable} ${className}`}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div className={`mb-3 ${className}`}>
      {children}
    </div>
  );
}

export interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold font-display text-[var(--ink)] ${className}`}>
      {children}
    </h3>
  );
}

export interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
