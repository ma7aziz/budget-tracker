import { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-[var(--muted)]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold font-display text-[var(--ink)] mb-2">{title}</h3>
      {description && (
        <p className="text-[var(--muted)] mb-4 max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
